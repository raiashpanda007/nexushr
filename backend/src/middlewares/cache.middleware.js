import { AsyncHandler } from "../utils/index.js";
import RedisClient from "../utils/redis.client.js";

const redisClient = RedisClient.getInstance().getClient();

export const ReadCacheMiddleware = AsyncHandler(async (req, res, next) => {
    const cacheKey = req.originalUrl;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        console.log(`Cache Hit for key: ${cacheKey}`);
        return res.status(200).json(JSON.parse(cachedData));
    }


    const originalJson = res.json;
    res.json = function (body) {
        res.json = originalJson;

        redisClient.setEx(cacheKey, 300, JSON.stringify(body)).catch(err => {
            console.error("Redis Cache Error:", err);
        });

        return originalJson.call(this, body);
    };

    console.log(`Cache Miss for key: ${cacheKey}`);
    next();
});

export const ClearCacheMiddleware = (key) => AsyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const cacheKey = id ? `${key}/${id}` : key;


    if (id) {
        await redisClient.del(cacheKey);
        console.log(`Cache Cleared for key: ${cacheKey}`);
        await redisClient.del(key);
        console.log(`Cache Cleared for key: ${key}`);
    } else {
        await redisClient.del(key);
        console.log(`Cache Cleared for key: ${key}`);
    }
    next();
});




