 import { createClient} from 'redis';

 
 export default class RedisClient {
   #instance
    #client
 
   constructor(REDIS_URL) {
     this.client = createClient({ url: REDIS_URL });
 
     
     this.client.on('connect', () => {
       console.log('Redis connected');
     });
 
     this.client.on('error', (err) => {
       console.error('Redis connection error:', err);
     });
 
     this.client.connect(); 
   }
 
   
 static GetInstance(REDIS_URL) {
     if (!RedisClient.instance) {
       RedisClient.instance = new RedisClient(REDIS_URL);
     }
 
     return RedisClient.instance;
   }
 
   
   GetClient() {
     return this.client;
   }
 }