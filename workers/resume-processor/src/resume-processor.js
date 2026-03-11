import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { ObjectId } from "mongodb";
import { Cfg } from "./conf/Config.js";
import DB from "./utils/Db.js";
import DownloadPdf from "./utils/DownloadResume.js";

const SQS_CLIENT = new SQSClient({
  region: Cfg.AWS_REGION,
  endpoint: Cfg.SQS_ENDPOINT,
});

const command = new ReceiveMessageCommand({
  QueueUrl: Cfg.SQS_QUEUE_URL,
  MaxNumberOfMessages: 1,
  VisibilityTimeout: 10,
  WaitTimeSeconds: 20,
});

const db = new DB(Cfg.MONGO_DB_URL, Cfg.DB_NAME);

await db.connect();

async function main() {
  while (true) {
    const { Messages } = await SQS_CLIENT.send(command);
    if (!Messages) {
      console.log("No message is received");
      continue;
    }

    try {
      for (const message of Messages) {
        const { Body, ReceiptHandle } = message;
        if (!Body) continue;

        const event = JSON.parse(Body);
        console.log("Received Event :: ", event);
        const { openingId } = event;


        const allResumeLinks = await db.getCollection("applicants").find({ openingId: new ObjectId(openingId) }).project({ _id: 1, resume: 1 }).toArray();
        console.log("All Resume Links :: ", allResumeLinks);


        await Promise.all(allResumeLinks.map(async (applicant) => {
          const { _id, resume } = applicant;
          const filePath = await DownloadPdf(resume, _id.toString(), openingId);
          console.log(`Resume for Applicant ${_id} downloaded at ${filePath}`);
        }));


        await SQS_CLIENT.send(
          new DeleteMessageCommand({
            QueueUrl: Cfg.SQS_QUEUE_URL,
            ReceiptHandle,
          }),
        );
      }
    } catch (error) {
      console.error("Error processing message: ", error);
    }
  }
}

main().catch((error) => {
  console.error("Error in main function: ", error);
});
