import cluster from "cluster";
import os from "os";
import App from "./server.js";
import Config from "./config/Config.js";



export const Cfg = new Config().MustLoad();

const CPUs = Math.floor(os.cpus().length / 2) < Cfg.INSTANCES ? Cfg.INSTANCES : Math.floor(os.cpus().length / 2)

if (cluster.isPrimary) {
  console.log("Primary process running:", process.pid);
  console.log(`Forking ${CPUs} workers...`);

  for (let i = 0; i < CPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', () => {
    console.log('Worker died — restarting...');
    cluster.fork();
  });

} else {
  const app = new App(Cfg.MONGO_DB_URL, Cfg.DB_NAME);
  app.Listen(Cfg.PORT);
}



