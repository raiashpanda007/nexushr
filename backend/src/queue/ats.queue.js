import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Cfg } from "../config/env.js";
const REGION = Cfg.SQS_REGION;
const ENDPOINT = Cfg.SQS_ENDPOINT;
const ACCESS_KEY = Cfg.SQS_ACCESS_KEY;
const SECRET_KEY = Cfg.SQS_SECRET_KEY;
const QUEUE_URL = Cfg.RESUME_PROCESSOR_QUEUE_URL;

const sqsClient = new SQSClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

export const SendResumeEvent = async (OpeningID) => {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({ openingId: OpeningID }),
  });
  await sqsClient.send(command)
};
