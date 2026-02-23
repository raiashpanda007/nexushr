
import IORedis from "ioredis";
import { Queue } from "bullmq";
import { Cfg } from "../config/env.js";

class RedisClient {
    static client = null;

    static init(host, port) {
        if (!RedisClient.client) {
            RedisClient.client = new IORedis({
                host,
                port,
                maxRetriesPerRequest: null,
            });
        }

        return RedisClient.client;
    }

    static getClient() {
        if (!RedisClient.client) {
            // Auto-initialize using env config if not already done
            RedisClient.init(Cfg.REDIS_HOST, Cfg.REDIS_PORT);
        }
        return RedisClient.client;
    }
}

export const OfflineBatchQueue = new Queue("offline-batch", {
    connection: RedisClient.getClient(),
});




export default RedisClient;
