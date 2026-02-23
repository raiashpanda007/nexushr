import IORedis from "ioredis";
import { Queue } from "bullmq";

class RedisClient {
    private static client: IORedis | null = null;

    static init(host: string, port: number) {
        if (!RedisClient.client) {
            RedisClient.client = new IORedis({
                host,
                port,
                maxRetriesPerRequest: null,
            });
        }

        return RedisClient.client;
    }

    static getClient(): IORedis {
        if (!RedisClient.client) {
            throw new Error("Redis not initialized. Call RedisClient.init()");
        }
        return RedisClient.client;
    }
}


const OfflineBatchQueue = new Queue("offline-batch", {
    connection: RedisClient.getClient()
})

