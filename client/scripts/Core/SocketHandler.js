import { WSConnectedEvent, WSDisconnectedEvent } from "../events.js";

export default class SocketHandler {
  constructor(authState) {
    this.socket = null;
    this.authState = authState;

    this.retryCount = 0;
    this.maxRetries = 10;
    this.baseRetryDelay = 1000;
  }

  connect() {
    this.socket = new WebSocket("ws://localhost:3000/ws");

    this.socket.addEventListener("open", () => {
      console.log("WebSocket connection established");
      this.retryCount = 0;

      const header = document.querySelector("app-header");
      header.dispatchEvent(WSConnectedEvent());
    });

    this.socket.addEventListener("close", () => {
      console.log("ws disconnected ");
      const header = document.querySelector("app-header");
      header.dispatchEvent(WSDisconnectedEvent());

      this.retry();
    });

    this.socket.addEventListener("error", () => {
      console.log("ws disconnected ");
      const header = document.querySelector("app-header");
      header.dispatchEvent(WSDisconnectedEvent());

      if (this.socket?.readyState !== WebSocket.OPEN) {
        this.retry();
      }
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

  retry() {
    if (this.retryCount >= this.maxRetries) {
      console.warn("Max WebSocket retry attempts reached");
      return;
    }

    const delay = this.baseRetryDelay * (10 * Math.random());

    console.log(`Retrying WebSocket connection in ${delay}ms...`);

    this.retryCount++;

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  CheckIn() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const user = this.authState.GetCurrUserState().data.user;
      console.log("user info in socket handler:", user);
      this.socket.send(
        JSON.stringify({
          type: "CheckIn",
          payload: { username: user.firstName + " " + user.lastName },
        }),
      );
    }
  }

  CheckOut() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const user = this.authState.GetCurrUserState().data.user;
      this.socket.send(
        JSON.stringify({
          type: "CheckOut",
          payload: { username: user.firstName + " " + user.lastName },
        }),
      );
    }
  }
}
