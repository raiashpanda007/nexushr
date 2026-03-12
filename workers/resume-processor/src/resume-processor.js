import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { createClient } from "redis";
import { ObjectId } from "mongodb";
import { Cfg } from "./conf/Config.js";
import DB from "./utils/Db.js";
import ATSEngine from "./engine/index.js";

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

const redisClient = createClient({ url: Cfg.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis error:", err));
await redisClient.connect();
console.log("Redis connected in resume-processor");

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

        const allResumeLinks = await db
          .getCollection("applicants")
          .find({ openingId: new ObjectId(openingId) })
          .project({ _id: 1, resume: 1 })
          .toArray();
        console.log("All Resume Links :: ", allResumeLinks);

        const openingSkills = await db
          .getCollection("openings")
          .aggregate([
            { $match: { _id: new ObjectId(openingId) } },
            { $unwind: "$skills" },
            {
              $lookup: {
                from: "skills",
                localField: "skills.skillId",
                foreignField: "_id",
                as: "skillDetails",
              },
            },
            { $unwind: "$skillDetails" },
            {
              $project: {
                _id: 0,
                name: "$skillDetails.name",
                proficiencyLevel: "$skills.proficiencyLevel",
              },
            },
          ])
          .toArray();
        console.log("Opening Skills :: ", openingSkills);

        const response = await ATSEngine(openingId, allResumeLinks, openingSkills);

        console.log("ATS Engine Response :: ", response);

        // Persist scores to MongoDB for each applicant
        if (response && response.length > 0) {
          const bulkOps = response.map(({ applicantId, normalizedScore }) => ({
            updateOne: {
              filter: { _id: applicantId },
              update: { $set: { score: normalizedScore } },
            },
          }));
          await db.getCollection("applicants").bulkWrite(bulkOps);
          console.log(`[ATS] Updated scores in DB for ${bulkOps.length} applicants`);
        }

        // Store results in Redis keyed by openingId with 1-hour TTL
        const redisKey = `ats:result:${openingId}`;
        await redisClient.set(
          redisKey,
          JSON.stringify({ results: response, applicantCount: allResumeLinks.length }),
          { EX: 3600 }
        );
        console.log(`[ATS] Stored results in Redis under key: ${redisKey} (${allResumeLinks.length} applicants)`);

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
