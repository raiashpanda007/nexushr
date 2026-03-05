module.exports = {
  apps: [
    {
      name: "nexushr-backend",
      cwd: "./backend",
      script: "./src/index.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexushr-image-worker",
      cwd: "./workers/image-worker",
      script: "./src/image-worker.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexushr-payroll-worker",
      cwd: "./workers/payroll-generator",
      script: "./src/payroll.generator.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexushr-payroll-batch",
      cwd: "./workers/payroll-batch",
      script: "./src/payroll.batch.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: 3,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nexushr-analytics-worker",
      cwd: "./workers/analytics",
      script: "./src/analytics-worker.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: 1,
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
