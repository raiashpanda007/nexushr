import { AddUserCustomEvent } from "../../events.js";

const HRCreateUserOptionTemplate = document.createElement("template");


HRCreateUserOptionTemplate.innerHTML = `
  <div id="hr-create-user-div" class="w-full max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Employees</h2>
        <p class="text-slate-500">Manage your organization's workforce</p>
      </div>
      <button id="add-user-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Employee
      </button>
    </div>
  </div>
`;



class HRCreateUserDiv extends HTMLElement {
  constructor() {
    super();
    this.appendChild(HRCreateUserOptionTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    const addUserBtn = this.querySelector("#add-user-btn");

    if (addUserBtn) {
      addUserBtn.addEventListener("click", () => {
        console.log("Add User Button Clicked");
        this.dispatchEvent(AddUserCustomEvent());
        console.log("AddUserCustomEvent Dispatched");
      });
    }
  }
}


customElements.define("app-dashboard-hr-create-user", HRCreateUserDiv);
