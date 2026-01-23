import { SSEConnectedEvent , SSEMessageEvent} from "../events.js";

class SSEHandler {
    constructor(url) {
        this.url = url;
        this.eventSource = null;
    }
    connect() {
        const header = document.querySelector("app-header");
        if (this.eventSource) {
            console.warn("SSE connection already established.");
            return;
        }
        this.eventSource = new EventSource(this.url);
        this.eventSource.onopen = (event) => {
            console.log("SSE connection opened:", event);
            header.dispatchEvent(SSEConnectedEvent(true));

        };
        this.eventSource.onmessage = (event) => {
            header.dispatchEvent(SSEMessageEvent(event.data));
        };
        this.eventSource.onerror = (event) => {
            console.error("SSE error:", event);
            this.eventSource = null;
            header.dispatchEvent(SSEConnectedEvent(false));
        };
        this.eventSource.close = () => {
            console.log("SSE connection closed.");
            this.eventSource = null;
            header.dispatchEvent(SSEConnectedEvent(false));
        };
    }
}


export default SSEHandler;