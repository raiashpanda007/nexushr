const LoaderTemplate = document.createElement('template');
LoaderTemplate.innerHTML = `
<style>
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 64px;
    left: 256px;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 50; 
    transition: left 0.3s ease-in-out; 
  }

  :host-context(body.sidebar-collapsed) {
      left: 80px;
  }

  .loader {
    width: 48px;
    height: 48px;
    border: 5px solid #E2E8F0;
    border-bottom-color: #3B82F6;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
<div class="loader"></div>
`;

class Loader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(LoaderTemplate.content.cloneNode(true));
    }

    connectedCallback() {
    }
}

customElements.define('app-loader', Loader);
