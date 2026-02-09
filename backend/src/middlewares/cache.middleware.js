import { AsyncHandler } from "../utils/index.js";
import RedisClient from "../utils/redis.client.js";

const redisClient = RedisClient.getInstance().getClient();

export const ReadCacheMiddleware = AsyncHandler(async (req, res, next) => {
    const cacheKey = req.originalUrl;

    // Read Logic
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        // Cache Hit
        console.log(`Cache Hit for key: ${cacheKey}`);
        return res.status(200).json(JSON.parse(cachedData));
    }

    // Write Logic - Override res.json to capture response
    const originalJson = res.json;
    res.json = function (body) {
        // Restore original method to avoid infinite loop if called again
        res.json = originalJson;

        // Cache the response asynchronously
        redisClient.setEx(cacheKey, 300, JSON.stringify(body)).catch(err => {
            console.error("Redis Cache Error:", err);
        });

        // Send response
        return originalJson.call(this, body);
    };

    console.log(`Cache Miss for key: ${cacheKey}`);
    next();
});

export const ClearCacheMiddleware = (key) => AsyncHandler(async (req, res, next) => {
    // Invalidate cache for the specific key
    if (key) {
        await redisClient.del(key);
        console.log(`Cache Cleared for key: ${key}`);
    }
    next();
});




