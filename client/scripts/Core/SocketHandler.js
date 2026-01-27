import { WSConnectedEvent, WSDisconnectedEvent } from "../events.js";

export default class SocketHandler {
  constructor(authState) {
    this.socket = null;
    this.authState = authState;

    this.retryInterval = null;
    this.retryDelay = 3000;
    this.isConnecting = false;
  }

  connect() {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    console.log("Attempting WebSocket connection...");

    this.socket = new WebSocket("ws://localhost:3000/ws");

    this.socket.addEventListener("open", () => {
      console.log("WebSocket connected");
      this.isConnecting = false;
      this.stopRetrying();

      const header = document.querySelector("app-header");
      header.dispatchEvent(WSConnectedEvent());
    });

    this.socket.addEventListener("close", () => {
      console.log("WebSocket disconnected");
      this.isConnecting = false;

      const header = document.querySelector("app-header");
      header.dispatchEvent(WSDisconnectedEvent());

      this.startRetrying();
    });

    this.socket.addEventListener("error", () => {
      console.log("WebSocket error");
      this.isConnecting = false;
      this.startRetrying();
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        if (type === "notification") {
          const notificationEvent = new CustomEvent("ws-notification", {
            detail: payload,
          });
          document
            .querySelector("app-header")
            .dispatchEvent(notificationEvent);
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    });
  }

  startRetrying() {
    if (this.retryInterval) return;



    this.retryInterval = setInterval(() => {
      if (
        !this.socket ||
        this.socket.readyState === WebSocket.CLOSED
      ) {
        this.connect();
      }
    }, this.retryDelay);
  }

  stopRetrying() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  CheckIn() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const user = this.authState.GetCurrUserState().data.user;
      this.socket.send(
        JSON.stringify({
          type: "CheckIn",
          payload: { username: `${user.firstName} ${user.lastName}` },
        }),
      );
    }
  }

  CheckOut() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const user = this.authState.GetCurrUserState().data.user;
      this.socket.send(
        JSON.stringify({
          type: "CheckOut",
          payload: { username: `${user.firstName} ${user.lastName}` },
        }),
      );
    }
  }
}
