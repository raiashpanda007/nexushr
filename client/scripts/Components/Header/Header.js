import { authState } from "../../Core/startup.js"
import { LogoutCustomEvent } from "../../events.js";


const headerTemplate = document.createElement("template");

headerTemplate.innerHTML = `
  <header class="w-full bg-slate-900/95 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <div class="flex-shrink-0 flex items-center cursor-pointer group">
          <h1 class="text-3xl font-bold text-white group-hover:opacity-80 transition-opacity">
            NexusHR
          </h1>
        </div>

        <nav class="hidden md:flex space-x-8 bg-white/5 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          <span class="text-slate-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer  text-sm font-medium">LPS</span>
          <span class="text-slate-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">SSE</span>
          <span class="text-slate-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">SPS</span>
          <span class="text-slate-300 hover:text-white hover:bg-white/10 hover:rounded-full px-3 py-1 cursor-pointer text-sm font-medium">WS</span>
        </nav>

      </div>
    </div>
  </header>
`;

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.appendChild(headerTemplate.content.cloneNode(true));
  }
}

customElements.define("app-header", AppHeader);
