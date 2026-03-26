import { z as zod } from "zod";
import { config as dotEnv } from "dotenv";


dotEnv();


const EnvSchema = zod.object({
  SQS_URL: zod.string().min(1),
  SQS_ENDPOINT: zod.string().min(1),
  AWS_REGION: zod.string().min(1),
  MONGO_DB_URL: zod.string().min(1),
  DB_NAME: zod.string().min(1),
  S3_ENDPOINT: zod.string().min(1),
  AWS_VIDEO_BUCKET: zod.string().min(1),
  AWS_TRANSCODING_BUCKET: zod.string().min(1),
  AWS_HLS_TRANSCODE_BUCKET: zod.string().min(1),
  NOTIFICATION_QUEUE_URL: zod.string().min(1),
  REDIS_URL: zod.string().min(1),
  LOCAL_MODE: zod.enum(["true", "false"]).default("false"),
  ECS_ENDPOINT: zod.string().min(1),
  ECS_CLUSTER_ARN: zod.string().min(1),
  ECS_TASK_DEFINITION: zod.string().min(1),
  ECS_CONTAINER_NAME: zod.string().min(1),
  ECS_SUBNET_IDS: zod.string().min(1),
  ECS_SECURITY_GROUP_ID: zod.string().min(1),
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


const Conf = new Config().MustLoad()


export {
  Conf
}






