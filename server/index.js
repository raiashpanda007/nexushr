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

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
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
