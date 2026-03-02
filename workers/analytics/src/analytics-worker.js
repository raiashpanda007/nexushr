import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { Cfg } from "./config/Config.js";
import HandleEvent from "./workers/worker.js";
import DB from "./utils/Db.js";

const SQS_CLIENT = new SQSClient({
    region: Cfg.AWS_REGION,
    endpoint: Cfg.SQS_ENDPOINT,
});

const DB_CLIENT = new DB(Cfg.MONGO_DB_URL, Cfg.DB_NAME);
await DB_CLIENT.connect();

const command = new ReceiveMessageCommand({
    QueueUrl: Cfg.SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 100,
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
                console.log("Received Event :: ", event);

                await HandleEvent(event, DB_CLIENT);
                await SQS_CLIENT.send(
                    new DeleteMessageCommand({
                        QueueUrl: Cfg.SQS_QUEUE_URL,
                        ReceiptHandle,
                    }),
                );
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    }
}

main().catch((error) => {
    console.error("Error in main function:", error);
});