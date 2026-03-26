import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import mongoose from "mongoose";
import { Cfg } from "./config/config.js";

// ---------------------------------------------------------------------------
// Videos model (minimal — only the fields this worker reads/writes)
// ---------------------------------------------------------------------------
const VideoSchema = new mongoose.Schema(
  {
    s3Key: String,
    transcoding_status: { type: String, enum: ["processing", "ready"], default: "processing" },
    hlsMasterUrl: String,
    versions: [
      {
        "240p": String,
        "360p": String,
        "480p": String,
        "720p": String,
        "1080p": String,
        "default": String,
      },
    ],
  },
  { strict: false }
);

const VideosModel = mongoose.model("Videos", VideoSchema);

// ---------------------------------------------------------------------------
// SQS client
// ---------------------------------------------------------------------------
const sqsClient = new SQSClient({
  region: Cfg.AWS_REGION,
  endpoint: Cfg.SQS_ENDPOINT,
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// Process one completion message
// ---------------------------------------------------------------------------
async function processMessage(message) {
  const { Body, ReceiptHandle } = message;
  if (!Body || !ReceiptHandle) return;

  let payload;
  try {
    payload = JSON.parse(Body);
  } catch {
    console.error("Invalid JSON in message body, skipping");
    return;
  }

  const { sourceKey, outputBucket, masterPlaylist, renditions = [] } = payload;

  if (!sourceKey || !outputBucket || !masterPlaylist) {
    console.error("Incomplete payload, skipping:", payload);
    return;
  }

  // Build full HLS master URL
  const hlsMasterUrl = `${Cfg.S3_ENDPOINT}/${outputBucket}/${masterPlaylist}`;

  // Build versions object from renditions (height → HLS playlist URL)
  const HEIGHT_TO_KEY = { 1080: "1080p", 720: "720p", 480: "480p", 360: "360p", 240: "240p" };
  const versionsUpdate = {};
  for (const r of renditions) {
    const key = HEIGHT_TO_KEY[r.height] ?? `${r.height}p`;
    versionsUpdate[key] = `${Cfg.S3_ENDPOINT}/${outputBucket}/${r.playlist}`;
  }

  try {
    // Match by s3Key (set on new uploads) OR by the raw S3 URL stored in versions[0].default
    // (fallback for documents created before s3Key was introduced)
    const result = await VideosModel.findOneAndUpdate(
      {
        $or: [
          { s3Key: sourceKey },
          { "versions.default": { $regex: sourceKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") } },
        ],
      },
      {
        $set: {
          transcoding_status: "ready",
          s3Key: sourceKey,
          hlsMasterUrl,
          versions: [versionsUpdate],
        },
      },
      { new: true }
    );

    if (!result) {
      console.warn(`No Video document found for s3Key="${sourceKey}" — skipping DB update`);
    } else {
      console.log(`Video updated — s3Key: ${sourceKey} | hlsMasterUrl: ${hlsMasterUrl}`);
    }
  } catch (err) {
    console.error("DB update failed:", err);
    return; // Don't delete message — let it retry
  }

  // Delete message only after successful DB update
  try {
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: Cfg.SQS_QUEUE_URL,
        ReceiptHandle,
      })
    );
  } catch (err) {
    console.error("Failed to delete SQS message:", err);
  }
}

// ---------------------------------------------------------------------------
// Long-poll loop
// ---------------------------------------------------------------------------
async function poll() {
  console.log("Transcoding-complete worker started — polling", Cfg.SQS_QUEUE_URL);

  while (true) {
    try {
      const { Messages } = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: Cfg.SQS_QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        })
      );

      if (!Messages || Messages.length === 0) {
        await sleep(1000);
        continue;
      }

      console.log(`Received ${Messages.length} message(s)`);
      for (const message of Messages) {
        await processMessage(message);
      }
    } catch (err) {
      console.error("Polling error:", err);
      await sleep(3000);
    }
  }
}

// ---------------------------------------------------------------------------
// Boot: connect to MongoDB, then start polling
// ---------------------------------------------------------------------------
async function boot() {
  await mongoose.connect(Cfg.MONGO_DB_URL, { dbName: Cfg.DB_NAME });
  console.log("MongoDB connected");
  await poll();
}

process.on("SIGINT", () => { console.log("Shutting down"); process.exit(0); });
process.on("SIGTERM", () => { console.log("Terminated"); process.exit(0); });

boot().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
