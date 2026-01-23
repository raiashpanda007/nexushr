import { NetworkStatusChange } from "../../events.js";
import { HealthChecker } from "../../utils.js";
const headerTemplate = document.createElement("template");

headerTemplate.innerHTML = `
  <header class="w-full bg-slate-900 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <div class="flex-shrink-0 flex items-center cursor-pointer group">
          <h1 class="text-3xl font-bold text-white group-hover:opacity-80 transition-opacity">
            NexusHR
          </h1>
        </div>

        <nav class="hidden md:flex space-x-8 bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
          <span class="text-slate-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer  text-sm font-medium">LPS</span>
          <span class="text-slate-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">SSE</span>
          <span id=app-sps-header class="text-red-300  hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">SPS</span>
          <span id="app-ws-header" class="text-red-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">WS</span>
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

  connectedCallback() {
    this.spsEl = this.querySelector("#app-sps-header");
    this.wsEl = this.querySelector("#app-ws-header");
    this.toastContainer = this.querySelector("#toast-container");

    // Set WS to red by default
    this.updateWSStatus(false);
    
    this.updateSPSStatus();

    // Listen for WebSocket connection events
    this.addEventListener("ws-connected", () => {
      this.updateWSStatus(true);
    });

    this.addEventListener("ws-disconnected", () => {
      this.updateWSStatus(false);
    });

    // Listen for WebSocket notification events
    this.addEventListener("ws-notification", (event) => {
      const message = event.detail?.message || event.detail || "New notification";
      this.showToast(message);
    });

    this.intervalId = setInterval(() => {
      this.updateSPSStatus();
    }, 5000);
  }

  showToast(message) {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = "bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg mb-2 flex items-center gap-2";
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

    // Trigger slide-in animation
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 10);

    // Remove toast after 2 seconds
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
