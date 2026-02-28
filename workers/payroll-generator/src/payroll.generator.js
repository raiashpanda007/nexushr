import Config from "./conf/config.js";
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand} from "@aws-sdk/client-sqs";
import DB from "./utils/Db.js";
import GetEmployeeBatches from "./utils/Employees.js";
const Cfg = new Config().MustLoad();

const SQS_CLIENT = new SQSClient({
  region: Cfg.AWS_REGION,
  endpoint: Cfg.SQS_ENDPOINT,
});

const command = new ReceiveMessageCommand({
  QueueUrl: Cfg.SUBSCRIBER_QUEUE_URL,
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

        const { department, month, year } = event;
        const employeeBatches = GetEmployeeBatches(db, department, month, year);

        for await (const batch of employeeBatches) {
          await SQS_CLIENT.send(
            new SendMessageCommand({
              QueueUrl: Cfg.PUBLISHER_QUEUE_URL,
              MessageBody: JSON.stringify(batch),
            }),
          );
        }

        await SQS_CLIENT.send(
          new DeleteMessageCommand({
            QueueUrl: Cfg.SUBSCRIBER_QUEUE_URL,
            ReceiptHandle,
          }),
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }
}
main();



