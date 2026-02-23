import { Worker } from "bullmq";
import { OfflineBatchQueue } from "../queue/index.js";
import { Cfg } from "../config/env.js";
const offlineQueueWorker = new Worker(
    OfflineBatchQueue.name,
    async (job) => {
        const { userId, attendannceBatch } = job.data;
        console.log("Processing offline batch for user:", userId);
        console.log("Batch:", attendannceBatch);
    },
    {
        connection: {
            host: Cfg.REDIS_HOST,
            port: Cfg.REDIS_PORT,
        },
    }
);


offlineQueueWorker.on

export default offlineQueueWorker;