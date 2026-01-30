import { NetworkStatusChange } from "../../events.js";
import { HealthChecker } from "../../utils.js";
const headerTemplate = document.createElement("template");

headerTemplate.innerHTML = `
  <header class="w-full bg-slate-900 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <div class="flex-shrink-0 flex items-center cursor-pointer group">
          <h1 id="header-logo" class="text-3xl font-bold text-white group-hover:opacity-80 transition-opacity">
            NexusHR
          </h1>
        </div>

        <nav class="hidden md:flex space-x-8 bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
          <span id="app-lps-header" class="text-red-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer  text-sm font-medium">LPS</span>
          <span id="app-sse-header" class="text-red-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">SSE</span>
          <span id=app-sps-header class="text-red-300  hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">SPS</span>
          <span id="app-ws-header" class="text-red-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">WS</span>
          <span id="app-sse-message" class=" text-white cursor-pointer"></span>    
        </nav>
        
      </div>
    </div>
    <div id="toast-container" class="absolute top-24 right-4 z-50"></div>
  </header>
`;

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.appendChild(headerTemplate.content.cloneNode(true));
    this.intervalId = null;
  }

  async updateSPSStatus() {
    if (!this.spsEl) return;

    const isHealthy = await HealthChecker();

    document.dispatchEvent(NetworkStatusChange(isHealthy));
    this.spsEl.classList.remove("text-green-400", "text-red-300");

    if (isHealthy) {
      this.spsEl.classList.add("text-green-400");
      this.spsEl.title = "Service is UP";
    } else {
      this.spsEl.classList.add("text-red-300");
      this.spsEl.title = "Service is DOWN";
    }
  }
  async updateLPSStatus(isPollingUp) {
    if (!this.lpsEl) return;

    this.lpsEl.classList.remove("text-green-400", "text-red-300");

    if (isPollingUp) {
      this.lpsEl.classList.add("text-green-400");
      this.lpsEl.title = "Long Polling is UP";
    } else {
      this.lpsEl.classList.add("text-red-300");
      this.lpsEl.title = "Long Polling is DOWN";
    }
  }

  async updateSSEStatus(isConnected) {
    if (!this.sseEl) return;

    this.sseEl.classList.remove("text-green-400", "text-red-300");
    if (isConnected) {
      this.sseEl.classList.add("text-green-400");
      this.sseEl.title = "SSE is Connected";
    } else {
      this.sseEl.classList.add("text-red-300");
      this.sseEl.title = "SSE is Disconnected";
    }
  }
  async updateSSEMessage(message = null) {
    if (!this.sseMessageEl) return;

    message
      ? (this.sseMessageEl.textContent = message)
      : (this.sseMessageEl.textContent = "");
  }
  connectedCallback() {
    this.spsEl = this.querySelector("#app-sps-header");
    this.wsEl = this.querySelector("#app-ws-header");
    this.lpsEl = this.querySelector("#app-lps-header");
    this.sseEl = this.querySelector("#app-sse-header");
    this.sseMessageEl = this.querySelector("#app-sse-message");
    this.toastContainer = this.querySelector("#toast-container");

    this.updateWSStatus(false);

    this.updateSPSStatus();
    this.updateLPSStatus(false);

    this.addEventListener("ws-connected", () => {
      this.updateWSStatus(true);
    });
    this.addEventListener("sse-connected-event", (event) => {
      const state = event.detail.state;
      if (!state) console.log("SSE disconnected event received in header");
      this.updateSSEStatus(state);
    });
    this.addEventListener("sse-message-event", (event) => {
      console.log("SSE message event received in header", event);
      const message = event.detail.message || event.detail || "New SSE message";
      this.updateSSEMessage(message);
    });

    this.addEventListener("long-polling-event", (event) => {
      const state = event.detail?.state;
      this.updateLPSStatus(state);
    });

    this.addEventListener("ws-disconnected", () => {
      this.updateWSStatus(false);
    });

    // Listen for WebSocket notification events
    this.addEventListener("ws-notification", (event) => {
      const message =
        event.detail?.message || event.detail || "New notification";
      this.showToast(message);
    });
    this.addEventListener("queue-flushed", () => {
      this.showToast("Offline changes synced successfully");
    });

    this.intervalId = setInterval(() => {
      this.updateSPSStatus();
    }, 5000);
  }

  showToast(message) {
    // Create toast element
    const toast = document.createElement("div");
    toast.className =
      "bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg mb-2 flex items-center gap-2";
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `;

    // Add toast to container
    this.toastContainer.appendChild(toast);


    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(120%)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  updateWSStatus(isConnected) {
    if (!this.wsEl) return;

    this.wsEl.classList.remove("text-green-400", "text-red-300");

    if (isConnected) {
      this.wsEl.classList.add("text-green-400");
      this.wsEl.title = "WebSocket is Connected";
    } else {
      this.wsEl.classList.add("text-red-300");
      this.wsEl.title = "WebSocket is Disconnected";
    }
  }

  disconnectedCallback() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

customElements.define("app-header", AppHeader);
