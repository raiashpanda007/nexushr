import { createClient } from 'redis';
import { Cfg } from '../config/env.js';
export default class RedisClient {
    static instance;
    client;


    constructor() {
        this.client = createClient({ url: Cfg.REDIS_URL });

        this.client.on('connect', () => {
            console.log('Redis connected');
        });

        this.client.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        this.client.connect();
    }

    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }

        return RedisClient.instance;
    }

    getClient() {
        return this.client;
    }
}