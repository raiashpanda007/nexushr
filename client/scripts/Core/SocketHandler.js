import { WSConnectedEvent, WSDisconnectedEvent } from "../events.js";

export default class SocketHandler {
  constructor(authState) {
    this.socket = null;
    this.authState = authState;
  }

  connect() {
    this.socket = new WebSocket("ws://localhost:3000/ws");

    this.socket.addEventListener("open", () => {
      console.log("WebSocket connection established");
      const header = document.querySelector("app-header");
      header.dispatchEvent(WSConnectedEvent());
    });
    this.socket.addEventListener("close", () => {
      console.log("ws disconnected ");
      const header = document.querySelector("app-header");
      header.dispatchEvent(WSDisconnectedEvent());
    });

    this.socket.addEventListener("error", () => {
      console.log("ws disconnected ");
      const header = document.querySelector("app-header");
      header.dispatchEvent(WSDisconnectedEvent());
    });
    this.socket.addEventListener("message", (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === "notification") {
            const notificationEvent = new CustomEvent("ws-notification", {
                detail: payload,
            });
            const header = document.querySelector("app-header");
            header.dispatchEvent(notificationEvent);
        }
        console.log("Received message:", event.data);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
  }

  CheckIn() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const user = this.authState.GetCurrUserState().data.user;
      console.log("user info in socket handler:", user);
      this.socket.send(
        JSON.stringify({
          "type": "CheckIn",
          "payload": { username: user.firstName + " " + user.lastName },
        }),
      );
    }
  }
  CheckOut() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const user = this.authState.GetCurrUserState().data.user;
      this.socket.send(
        JSON.stringify({
          "type"  : "CheckOut",
          "payload": { username: user.firstName + " " + user.lastName },
        }),
      );
    }
  }
}
