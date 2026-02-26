import App from "./server.js";
import { Cfg } from "./config/env.js";



const Server = new App(Cfg.MONGO_DB_URL, Cfg.DB_NAME, Cfg.REDIS_URL);

Server.Listen(Cfg.PORT);