module.exports = {
  apps: [
    {
      name: "nexushr-backend",
      cwd: "./backend",
      script: "./src/index.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: "max",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexushr-worker",
      cwd: "./workers",
      script: "./src/image-worker.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: 2,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexushr-client",
      cwd: "./client",
      script: "npm",
      args: "run dev -- --host 0.0.0.0 --port 5173",
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};
