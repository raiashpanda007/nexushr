import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

// ---------------------------------------------------------------------------
// Resolution ladder (highest → lowest). Only resolutions ≤ source are used.
// ---------------------------------------------------------------------------
const RESOLUTION_LADDER = [
  { name: "1080p", height: 1080, width: 1920, videoBitrate: "5000k", audioBitrate: "192k" },
  { name: "720p",  height: 720,  width: 1280, videoBitrate: "2800k", audioBitrate: "128k" },
  { name: "480p",  height: 480,  width: 854,  videoBitrate: "1400k", audioBitrate: "96k"  },
  { name: "360p",  height: 360,  width: 640,  videoBitrate: "800k",  audioBitrate: "64k"  },
];

const HLS_SEGMENT_DURATION = 6;
const TEMP_DIR = "/tmp/transcoding";

// ---------------------------------------------------------------------------
// AWS clients — no hardcoded credentials.
// In ECS, the task IAM role provides credentials automatically.
// In dev (LocalStack), S3_ENDPOINT / SQS_ENDPOINT env vars redirect traffic.
// ---------------------------------------------------------------------------
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  }),
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION ?? "ap-south-1",
  ...(process.env.SQS_ENDPOINT && {
    endpoint: process.env.SQS_ENDPOINT,
  }),
});

// ---------------------------------------------------------------------------
// Required env vars (injected by ECS task definition overrides)
// ---------------------------------------------------------------------------
const SOURCE_BUCKET        = process.env.BUCKET_NAME;
const KEY                  = process.env.KEY;
const OUTPUT_BUCKET        = process.env.OUTPUT_BUCKET;
const NOTIFICATION_QUEUE   = process.env.NOTIFICATION_QUEUE_URL;

function assertEnv() {
  const missing = ["BUCKET_NAME", "KEY", "OUTPUT_BUCKET", "NOTIFICATION_QUEUE_URL"]
    .filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

// ---------------------------------------------------------------------------
// Probe source video — returns { width, height }
// ---------------------------------------------------------------------------
function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0",
      filePath,
    ]);

    let output = "";
    proc.stdout.on("data", (d) => (output += d));
    proc.stderr.on("data", (d) => process.stderr.write(d));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited with code ${code}`));
      const [w, h] = output.trim().split(",").map(Number);
      if (!w || !h) return reject(new Error("Could not parse video dimensions"));
      resolve({ width: w, height: h });
    });
  });
}

// ---------------------------------------------------------------------------
// Single-pass ffmpeg: transcode all resolutions → HLS simultaneously.
// This is significantly faster than running ffmpeg once per resolution.
// ---------------------------------------------------------------------------
function transcodeAllToHLS(inputPath, resolutions, tempDir) {
  return new Promise((resolve, reject) => {
    // Build multi-output ffmpeg argument list
    const args = ["-i", inputPath, "-y"];

    for (const r of resolutions) {
      args.push(
        "-map", "0:v:0",
        "-map", "0:a:0",
        // Scale to target height, auto-fit width (keeps aspect ratio, width ÷2)
        "-vf", `scale=-2:${r.height}`,
        "-c:v", "libx264",
        "-preset", "veryfast",    // fast enough for batch; swap to 'fast' for quality
        "-crf", "23",
        "-maxrate", r.videoBitrate,
        "-bufsize", `${parseInt(r.videoBitrate) * 2}k`,
        "-c:a", "aac",
        "-b:a", r.audioBitrate,
        "-hls_time", String(HLS_SEGMENT_DURATION),
        "-hls_list_size", "0",
        "-hls_flags", "independent_segments",
        "-hls_segment_type", "mpegts",
        "-hls_segment_filename", path.join(tempDir, r.name, "seg_%04d.ts"),
        "-f", "hls",
        path.join(tempDir, r.name, "index.m3u8")
      );
    }

    console.log("Running ffmpeg with args:", args.join(" "));

    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    proc.stdout.on("data", (d) => process.stdout.write(d));
    proc.stderr.on("data", (d) => process.stderr.write(d));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Upload every file in a local directory to S3 under s3Prefix/
// ---------------------------------------------------------------------------
async function uploadDirectory(localDir, s3Prefix) {
  const files = fs.readdirSync(localDir);

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(localDir, file);
      const isPlaylist = file.endsWith(".m3u8");

      await s3Client.send(
        new PutObjectCommand({
          Bucket: OUTPUT_BUCKET,
          Key: `${s3Prefix}/${file}`,
          Body: fs.createReadStream(filePath),
          ContentType: isPlaylist
            ? "application/vnd.apple.mpegurl"
            : "video/mp2t",
          CacheControl: isPlaylist ? "no-cache" : "max-age=31536000",
        })
      );
    })
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const init = async () => {
  assertEnv();

  const videoId = path.parse(path.basename(KEY)).name;
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // 1. Download source video from S3
  const localInputPath = path.join(TEMP_DIR, path.basename(KEY));
  console.log(`Downloading s3://${SOURCE_BUCKET}/${KEY} …`);

  const { Body } = await s3Client.send(
    new GetObjectCommand({ Bucket: SOURCE_BUCKET, Key: KEY })
  );
  await pipeline(Body, fs.createWriteStream(localInputPath));

  // 2. Probe source resolution
  const { width: srcW, height: srcH } = await probeVideo(localInputPath);
  console.log(`Source resolution: ${srcW}×${srcH}`);

  // 3. Keep only resolutions that are strictly downscales
  let targets = RESOLUTION_LADDER.filter(
    (r) => r.height <= srcH && r.width <= srcW
  );

  if (targets.length === 0) {
    // Source is already the smallest — encode at native resolution
    targets = [
      {
        name: "native",
        height: srcH,
        width: srcW,
        videoBitrate: "1000k",
        audioBitrate: "64k",
      },
    ];
  }

  console.log(`Target renditions: ${targets.map((r) => r.name).join(", ")}`);

  // 4. Create per-resolution output dirs
  for (const r of targets) {
    fs.mkdirSync(path.join(TEMP_DIR, r.name), { recursive: true });
  }

  // 5. Single-pass transcode → HLS for all renditions
  console.log("Transcoding (single pass, all renditions) …");
  await transcodeAllToHLS(localInputPath, targets, TEMP_DIR);

  // 6. Upload segments + per-rendition playlists
  console.log("Uploading HLS segments …");
  await Promise.all(
    targets.map((r) =>
      uploadDirectory(path.join(TEMP_DIR, r.name), `${videoId}/${r.name}`)
    )
  );

  // 7. Build and upload master playlist
  const BANDWIDTH = {
    "5000k": 5000000, "2800k": 2800000,
    "1400k": 1400000, "800k": 800000, "1000k": 1000000,
  };

  const masterLines = ["#EXTM3U", "#EXT-X-VERSION:3", ""];
  for (const r of targets) {
    masterLines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${BANDWIDTH[r.videoBitrate] ?? 1000000},RESOLUTION=${r.width}x${r.height},NAME="${r.name}"`,
      `${r.name}/index.m3u8`,
      ""
    );
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: OUTPUT_BUCKET,
      Key: `${videoId}/master.m3u8`,
      Body: masterLines.join("\n"),
      ContentType: "application/vnd.apple.mpegurl",
      CacheControl: "no-cache",
    })
  );
  console.log(`Master playlist → s3://${OUTPUT_BUCKET}/${videoId}/master.m3u8`);

  // 8. Notify completion via SQS
  const completionPayload = {
    videoId,
    sourceKey: KEY,
    sourceBucket: SOURCE_BUCKET,
    outputBucket: OUTPUT_BUCKET,
    masterPlaylist: `${videoId}/master.m3u8`,
    renditions: targets.map((r) => ({
      name: r.name,
      width: r.width,
      height: r.height,
      playlist: `${videoId}/${r.name}/index.m3u8`,
    })),
    completedAt: new Date().toISOString(),
  };

  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: NOTIFICATION_QUEUE,
      MessageBody: JSON.stringify(completionPayload),
    })
  );
  console.log("Completion notification sent →", NOTIFICATION_QUEUE);
  console.log("Done.");
};

init()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
