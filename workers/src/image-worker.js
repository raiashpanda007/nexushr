import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
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

        for (const record of event.Records) {
          const bucketName = record.s3.bucket.name;
          const objectKey = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " "),
          );

          console.log("File uploaded:", objectKey);
          console.log("Bucket:", bucketName);

          // Download file from S3
          // const getObjectCommand = new GetObjectCommand({
          //   Bucket: bucketName,
          //   Key: objectKey,
          // });

          // const response = await S3_CLIENT.send(getObjectCommand);

          // const chunks = [];
          // for await (const chunk of response.Body) {
          //   chunks.push(chunk);
          // }

          // const fileBuffer = Buffer.concat(chunks);

          // fs.writeFileSync(
          //   `./downloads/${objectKey.split("/").pop()}`,
          //   fileBuffer,
          // );
          const UserId = objectKey.split("/")[1];
          await ImageProcessor(UserId,bucketName,objectKey,dbInstance);

          // console.log("File downloaded successfully");
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
