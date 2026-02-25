import { createClient, type RedisClientType  } from 'redis';
import type { ConfigType } from "../types/config.types";

export default class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;

  private constructor(cfg: ConfigType) {
    this.client = createClient({ url: cfg.REDIS_URL });

    
    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.connect(); 
  }

  
  public static GetInstance(cfg: ConfigType): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(cfg);
    }

    return RedisClient.instance;
  }

  
  public GetClient(): RedisClientType {
    return this.client;
  }
}