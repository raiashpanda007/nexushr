import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { createClient } from "redis";
import ImageProcessor from "./utils/processor/Image/Image.js";
import SysConf from "./conf/config.js";
import DB from "./utils/Db.js";
const Config = new SysConf().MustLoad();

const SQS_CLIENT = new SQSClient({
  region: Config.AWS_REGION || "ap-south-1",
  endpoint: Config.SQS_ENDPOINT || "http://localhost:4566",
});

const command = new ReceiveMessageCommand({
  QueueUrl:
    Config.SQS_URL || "http://localhost:4566/000000000000/punch-processor",
  MaxNumberOfMessages: 1,
  VisibilityTimeout: 10,
  WaitTimeSeconds: 20,
});

const dbInstance = new DB(Config.MONGO_DB_URL, Config.DB_NAME);
await dbInstance.Connect();

// Connect to Redis
const redisClient = createClient({ url: Config.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis error:", err));
await redisClient.connect();
console.log("Redis connected in worker");

async function ProcessMessages() {
  while (true) {
    const { Messages } = await SQS_CLIENT.send(command);
    if (!Messages) {
      console.log("No message is recieved");
      continue;
    }

    try {
      for (const message of Messages) {
        const { Body, ReceiptHandle } = message;
        if (!Body) continue;

        const event = JSON.parse(Body);
        if ("Service" in event && "Event" in event) {
          if (event.Service === "s3:TestEvent") continue;
        }

        if (!event.Records || !Array.isArray(event.Records)) {
          continue;
        }

        for (const record of event.Records) {
          const bucketName = record.s3.bucket.name;
          const objectKey = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " "),
          );

          console.log("File uploaded:", objectKey);
          console.log("Bucket:", bucketName);

          
          const UserId = objectKey.split("/")[1];
          const response = await ImageProcessor(UserId,bucketName,objectKey,dbInstance);

          console.log("Processing result:", response);


          const s3BaseUrl = Config.S3_ENDPOINT || "http://localhost:4566";
          const photoUrl = `${s3BaseUrl}/${bucketName}/${objectKey}`;
          
          const redisValue = JSON.stringify({
            match: response?.matchResult?.match ?? false,
            distance: response?.matchResult?.distance ?? null,
            processedAt: new Date().toISOString(),
          });

          // Store with 5 minute TTL so keys auto-expire
          await redisClient.set(photoUrl, redisValue, { EX: 300 });
          console.log(`Stored verification result in Redis: ${photoUrl} => ${redisValue}`);
          
        }

        await SQS_CLIENT.send(
          new DeleteMessageCommand({
            QueueUrl: Config.SQS_URL,
            ReceiptHandle: ReceiptHandle,
          }),
        );
      }
    } catch (error) {
      console.error("Error in processing message", error);
    }
  }
}

ProcessMessages();
