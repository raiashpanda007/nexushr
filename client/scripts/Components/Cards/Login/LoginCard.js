import { LoginCustomEvent } from "../../../events.js"

const loginFormTemplate = document.createElement("template");

loginFormTemplate.innerHTML = `
  <form name="loginForm" class="w-full max-w-md mx-auto">
    <div class="bg-white rounded-xl border border-slate-200">
      <div class="p-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p class="text-sm text-slate-500 mt-2">Please sign in to continue</p>
        </div>
      
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Email Address</label>
            <input type="email" name="loginEmail" class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors" placeholder="you@example.com">
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Password</label>
            <input type="password" name="loginPassword" class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors" placeholder="••••••••">
          </div>
          <span class="text-red-500 font-semibold hidden" id="errorForm"></span>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
            Sign In
          </button>
          
        </div>
      </div>
    </div>
  </form>
`

class LoginCard extends HTMLElement {
  constructor() {
    super();
    this.appendChild(loginFormTemplate.content.cloneNode(true));
  }
  connectedCallback() {
    const form = this.querySelector('form');
    const errorForm = this.querySelector('#errorForm');
    form.loginEmail.value = sessionStorage.getItem("userEmail");
    form.addEventListener("change", (e) => {
      if (e.target.name === "loginEmail") {
        sessionStorage.setItem('userEmail', e.target.value)
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.dispatchEvent(LoginCustomEvent(e.target[0].value, e.target[1].value));
    })
    this.addEventListener("login-error", (e) => {
      console.log("error caught", e);
      console.log(errorForm);
      errorForm.classList.remove("hidden");
      errorForm.textContent = e.detail.error;
    })
  }
}

customElements.define("app-card-login", LoginCard);


