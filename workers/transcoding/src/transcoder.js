import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, } from "@aws-sdk/client-sqs";
import { ECSClient, RunTaskCommand, } from "@aws-sdk/client-ecs";
import { spawn } from "child_process";
import { Conf } from "./config/config.js";
// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const sqsClient = new SQSClient({
  region: Conf.AWS_REGION,
  endpoint: Conf.SQS_ENDPOINT,
});

const ecsClient = new ECSClient({
  region: Conf.AWS_REGION,
  endpoint: Conf.ECS_ENDPOINT,
});

const subnets = Conf.ECS_SUBNET_IDS.split(",").map((s) => s.trim());

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// LOCAL MODE: run the Docker container directly instead of ECS
// ---------------------------------------------------------------------------
function spawnLocalDockerTask(bucketName, objectKey) {
  return new Promise((resolve, reject) => {
    const args = [
      "run", "--rm",
      "--network", "host",
      // LocalStack dummy credentials — SDK requires these even for local endpoints
      "-e", "AWS_ACCESS_KEY_ID=test",
      "-e", "AWS_SECRET_ACCESS_KEY=test",
      "-e", `BUCKET_NAME=${bucketName}`,
      "-e", `KEY=${objectKey}`,
      "-e", `OUTPUT_BUCKET=${Conf.AWS_HLS_TRANSCODE_BUCKET}`,
      "-e", `NOTIFICATION_QUEUE_URL=${Conf.NOTIFICATION_QUEUE_URL}`,
      "-e", `AWS_REGION=${Conf.AWS_REGION}`,
      "-e", `S3_ENDPOINT=${Conf.S3_ENDPOINT}`,
      "-e", `SQS_ENDPOINT=${Conf.SQS_ENDPOINT}`,
      "raiashpanda007/nexushrtranscoder:latest",
    ];

    console.log(`[LOCAL] docker run for key: ${objectKey}`);
    const proc = spawn("docker", args, { stdio: "inherit" });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`[LOCAL] Container finished — key: ${objectKey}`);
        resolve();
      } else {
        reject(new Error(`[LOCAL] Container exited with code ${code} for key: ${objectKey}`));
      }
    });

    proc.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Spawn an ECS Fargate task for a single S3 object
// ---------------------------------------------------------------------------
async function spawnTranscodeTask(bucketName, objectKey) {
  if (Conf.LOCAL_MODE === "true") {
    return spawnLocalDockerTask(bucketName, objectKey);
  }

  const command = new RunTaskCommand({
    cluster: Conf.ECS_CLUSTER_ARN,
    taskDefinition: Conf.ECS_TASK_DEFINITION,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        securityGroups: [Conf.ECS_SECURITY_GROUP_ID],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: Conf.ECS_CONTAINER_NAME,
          environment: [
            { name: "BUCKET_NAME", value: bucketName },
            { name: "KEY", value: objectKey },
            { name: "OUTPUT_BUCKET", value: Conf.AWS_HLS_TRANSCODE_BUCKET },
            { name: "NOTIFICATION_QUEUE_URL", value: Conf.NOTIFICATION_QUEUE_URL },
            { name: "AWS_REGION", value: Conf.AWS_REGION },
            { name: "S3_ENDPOINT", value: Conf.S3_ENDPOINT },
            { name: "SQS_ENDPOINT", value: Conf.SQS_ENDPOINT },
          ],
        },
      ],
    },
  });

  const response = await ecsClient.send(command);
  const taskArn = response.tasks?.[0]?.taskArn ?? "unknown";
  console.log(`ECS task launched — key: ${objectKey} | taskArn: ${taskArn}`);
  return taskArn;
}

// ---------------------------------------------------------------------------
// Process one SQS message: parse S3 event, spawn ECS task per record
// ---------------------------------------------------------------------------
async function processMessage(message) {
  const { Body, ReceiptHandle } = message;
  if (!Body || !ReceiptHandle) return;

  let event;
  try {
    event = JSON.parse(Body);
  } catch {
    console.error("Invalid JSON in message body, skipping");
    return;
  }

  // Drop S3 test events
  if (event.Service === "s3:TestEvent") return;

  if (!Array.isArray(event.Records) || event.Records.length === 0) return;

  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " ")
      );

      console.log(`S3 upload detected — bucket: ${bucketName} | key: ${objectKey}`);
      await spawnTranscodeTask(bucketName, objectKey);
    } catch (err) {
      console.error("Error spawning ECS task for record:", err);
    }
  }

  // Delete message only after all tasks for it have been dispatched
  try {
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: Conf.SQS_URL,
        ReceiptHandle,
      })
    );
    console.log("SQS message deleted");
  } catch (err) {
    console.error("Failed to delete SQS message:", err);
  }
}

// ---------------------------------------------------------------------------
// Long-poll loop
// ---------------------------------------------------------------------------
async function poll() {
  console.log("Transcoding dispatcher started — polling", Conf.SQS_URL);

  while (true) {
    try {
      const { Messages } = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: Conf.SQS_URL,
          MaxNumberOfMessages: 5,
          VisibilityTimeout: 60,
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
// Graceful shutdown
// ---------------------------------------------------------------------------
process.on("SIGINT", () => { console.log("Shutting down"); process.exit(0); });
process.on("SIGTERM", () => { console.log("Terminated"); process.exit(0); });

poll().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
