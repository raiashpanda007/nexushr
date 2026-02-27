import Config from "./conf/config.js";
import {  SQSClient,  ReceiveMessageCommand,  DeleteMessageCommand,} from "@aws-sdk/client-sqs";
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
        console.log("Received event:", event);

   
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