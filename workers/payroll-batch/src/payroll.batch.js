import { ObjectId } from "mongodb";
import Config from "./conf/Config.js";
import DB from "./utils/Db.js"
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
const Cfg = new Config().MustLoad();

const db = new DB(Cfg.MONGO_DB_URL, Cfg.DB_NAME);
await db.connect()


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

        const { employees, month, year, bulkBonus = [], bulkDeduction = [] } = event;

        if (Array.isArray(employees) && employees.length > 0) {
          const collection = db.getCollection("payrolls");

          // Check which employees already have a payroll for this month/year
          const userIds = employees.map((emp) => new ObjectId(emp._id));
          const existing = await collection
            .find({ user: { $in: userIds }, month, year }, { projection: { user: 1 } })
            .toArray();
          const existingUserIds = new Set(existing.map((p) => p.user.toString()));

          const ops = [];
          for (const emp of employees) {
            if (existingUserIds.has(emp._id.toString())) {
              console.log(`Skipping ${emp._id} — payroll already exists for ${month}/${year}`);
              continue;
            }

            const bonus = [
              ...(emp.lastPayroll?.bonus || []),
              ...bulkBonus,
            ];

            const deduction = [
              ...(emp.leaveDeductions || []),
              ...bulkDeduction,
            ];

            ops.push({
              insertOne: {
                document: {
                  user: new ObjectId(emp._id),
                  salary: emp.salary?._id ? new ObjectId(emp.salary._id) : undefined,
                  bonus,
                  deduction,
                  month,
                  year,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            });
          }

          if (ops.length > 0) {
            try {
              const result = await collection.bulkWrite(ops, { ordered: false });
              console.log(`Inserted ${result.insertedCount} payroll records, skipped ${employees.length - ops.length} existing`);
            } catch (bulkErr) {
              console.error("BulkWrite error:", bulkErr);
            }
          } else {
            console.log("All employees in this batch already have payrolls, skipped entirely");
          }
        }

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
