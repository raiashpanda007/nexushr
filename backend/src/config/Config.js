import { config as dotenvConfig } from "dotenv";
import { z as zod } from "zod";

dotenvConfig();

const EnvSchema = zod.object({
  PORT: zod.coerce.number().int().positive(),
  INSTANCES: zod.coerce.number().int().positive(),
  ACCESS_TOKEN_SECRET: zod.string().min(1),
  MONGO_DB_URL: zod.string().min(1),
  DB_NAME: zod.string().min(1),
  REFRESH_TOKEN: zod.string().min(1),
  REDIS_URL: zod.string().min(1),
  REDIS_HOST: zod.string().min(1),
  REDIS_PORT: zod.coerce.number().int().positive(),
  SQS_URL: zod.string().min(1),
  SQS_REGION: zod.string().min(1),
  SQS_ENDPOINT: zod.string().min(1),
  SQS_ACCESS_KEY: zod.string().min(1),
  SQS_SECRET_KEY: zod.string().min(1),
  ANALYTICS_SQS_URL: zod.string().min(1),
  ZOOM_ACCOUNT_ID: zod.string().min(1),
  ZOOM_CLIENT_ID: zod.string().min(1),
  ZOOM_CLIENT_SECRET: zod.string().min(1),
  ZOOM_SECRET_TOKEN: zod.string().min(1),
  MAILSERVER_QUEUE_URL: zod.string().min(1),
  RESUME_PROCESSOR_QUEUE_URL: zod.string().min(1),
});

class Config {
  MustLoad() {
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment variables:", parsed.error.format());
      process.exit(1);
    }

    return parsed.data;
  }
}

export default Config;
