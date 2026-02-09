class Cache {
    constructor(redis) {
        this.redis = redis;
    }

    async get(key) {
        const data = await this.redis.get(key);
        return data;
    }

    async set(key, value) {
        await this.redis.set(key, value);
    }
}
