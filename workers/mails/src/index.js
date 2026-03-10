import { Cfg } from "./utils/Config.js";
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import nodemailer from "nodemailer";

const sqsClient = new SQSClient({
  region: Cfg.AWS_REGION,
  endpoint: Cfg.SQS_ENDPOINT,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: Cfg.USER_EMAIL,
    pass: Cfg.USER_PASSWORD,
  },
});

async function processMessages() {
    console.log("Checking for new messages...");
  try {
    const receiveParams = {
      QueueUrl: Cfg.SQS_QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };
    const data = await sqsClient.send(new ReceiveMessageCommand(receiveParams));
    if (data.Messages) {
      for (const message of data.Messages) {
        try {
          const { to, subject, text, html } = JSON.parse(message.Body);
          await transporter.sendMail({
            from: Cfg.USER_EMAIL,
            to,
            subject,
            text,
            ...(html && { html }),
          });
          console.log(`Email sent to ${to} with subject "${subject}"`);
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: Cfg.SQS_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          }));
        } catch (emailError) {
          console.error("Error processing message:", emailError);
        }
      }
    }
  } catch (error) {
    console.error("Error receiving messages:", error);
  }
}

setInterval(processMessages, 1000);