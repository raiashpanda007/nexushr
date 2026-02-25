import type { ConfigType } from "../config/index";
import type mongoose from "mongoose";

import type { RedisClientType } from "redis";

export interface ServicesType {
    Redis: RedisClientType;
    Db: typeof mongoose;
}

export type { ConfigType }