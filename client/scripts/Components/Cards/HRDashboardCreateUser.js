import { AddUserCustomEvent } from "../../events.js";

const HRCreateUserOptionTemplate = document.createElement("template");


HRCreateUserOptionTemplate.innerHTML = `
  <div id="hr-create-user-div" class="w-full max-w-7xl mx-auto p-6">
    <h1 class="font-bold text-4xl">
      Create a new employee  
    </h1> 
  <button class="font-bold text-2xl border p-2 rounded">
    Add new User
  </button>
  </div>

`;



class HRCreateUserDiv extends HTMLElement {
  constructor() {
    super();
    this.appendChild(HRCreateUserOptionTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    const rootDiv = this.querySelector("#hr-create-user-div");
    const addUserBtn = this.querySelector("button");

    addUserBtn.addEventListener("click", () => {
      console.log("Add User Button Clicked");
      this.dispatchEvent(AddUserCustomEvent());
      console.log("AddUserCustomEvent Dispatched");
    });
  }
}


customElements.define("app-dashboard-hr-create-user", HRCreateUserDiv);
