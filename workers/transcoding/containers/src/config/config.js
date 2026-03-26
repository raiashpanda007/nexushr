import { z as zod } from "zod";
import { config as dotEnvConfig } from "dotenv";

dotEnvConfig();


const EnvSchema = zod.object({
  AWS_REGION: zod.string().min(1),
  AWS_ACCESS_KEY: zod.string().min(1),
  AWS_SECRET_KEY: zod.string().min(1),

})
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


export const Conf = new Config().MustLoad();
