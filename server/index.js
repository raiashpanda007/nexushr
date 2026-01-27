import express from "express";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5000",
  }),
);
app.use(express.json());

let waitingClients = [];
let messageId = 0;
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});



app.post("/sync", (req, res) => {
  console.log("Received sync data:", req.body);
  res.status(200).send("Sync data received");
});


app.get("/poll", (req, res) => {
  console.log("Client connected to poll");

  const timeout = setTimeout(() => {
    res.json({
      ok: true,
      data: null,
      timeout: true,
    });
  }, 15000);


  waitingClients.push({ res, timeout });


  req.on("close", () => {
    clearTimeout(timeout);
    waitingClients = waitingClients.filter(c => c.res !== res);
  });
});



setInterval(() => {
  if (waitingClients.length === 0) return;

  const payload = {
    id: ++messageId,
    message: "New update from server",
    time: Date.now(),
  };


  waitingClients.forEach(({ res, timeout }) => {
    clearTimeout(timeout);
    res.json({
      ok: true,
      data: payload,
    });
  });

  waitingClients = [];
}, 5000);




app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();
  res.write(`data: Connected to SSE\n\n`);

  const interval = setInterval(() => {
    const payload = {
      time: new Date().toISOString(),
      random: Math.floor(10 * Math.random()),
    };

    res.write(`data: time :: ${payload.time} random :: ${payload.random}\n\n`);
    console.log("Sent SSE message:", payload);
  }, 2000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
    console.log("Client disconnected");
  });
});


server.listen(3000, () => {
  console.log("Server started on port 3000");
});

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.send(
    JSON.stringify({
      type: "connected",
      payload: "WebSocket connection established",
    }),
  );
  ws.on("message", (data) => {
    try {
      const { type, payload } = JSON.parse(data.toString());
      console.log("Received message:", type, payload);
      switch (type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong", payload: "Pong response" }));
          break;
        case "CheckIn":
          console.log("payload in checkin:", payload);

          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "notification",
                  payload: `${payload.username} has checked in!`,
                }),
              );
            }
          });
          break;
        case "CheckOut":
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "notification",
                  payload: payload.username + " has checked out!",
                }),
              );
            }
          });
          break;
        default:
          ws.send(
            JSON.stringify({ type: "error", payload: "Unknown message type" }),
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({ type: "error", payload: "Error processing message" }),
      );
    }
  });
});
