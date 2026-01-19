import { authState } from "../../Core/startup.js"
import { AddDepartmentCustomEvent, AddSkillCustomEvent, AddLeaveTypeCustomEvent } from "../../events.js";
const HROptionsDivTemplate = document.createElement("template");


HROptionsDivTemplate.innerHTML = `
  <div id="hr-options-top-div" class="w-full max-w-7xl mx-auto p-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button id="hr-options-add-department" class="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 flex flex-col items-center text-center gap-3 transition-shadow duration-200 cursor-pointer">
        <h3 class="text-lg font-semibold text-slate-800">Add Department</h3>
        <p class="text-sm text-slate-500">Create new departments to organize your workforce structure.</p>
      </button>

      <button id="hr-options-add-skill" class="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 flex flex-col items-center text-center gap-3 transition-shadow duration-200 cursor-pointer">
        <h3 class="text-lg font-semibold text-slate-800">Add Skill</h3>
        <p class="text-sm text-slate-500">Define new skills and competencies for employee growth.</p>
      </button>

      <button id="hr-options-add-leavetype" class="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 flex flex-col items-center text-center gap-3 transition-shadow duration-200 cursor-pointer">
        <h3 class="text-lg font-semibold text-slate-800">Add Leave Type</h3>
        <p class="text-sm text-slate-500">Configure leave policies and time-off categories.</p>
      </button>
    </div>
  </div>
`




class HROptionsDiv extends HTMLElement {
  constructor() {
    super();
    this.appendChild(HROptionsDivTemplate.content.cloneNode(true));
  }
  connectedCallback() {
    const rootDiv = this.querySelector("#hr-options-top-div");

    const addDeptbtn = this.querySelector("#hr-options-add-department");
    addDeptbtn.addEventListener("click", () => {
      this.dispatchEvent(AddDepartmentCustomEvent());
    })

    const addSkillBtn = this.querySelector("#hr-options-add-skill");
    addSkillBtn.addEventListener("click", () => {
      this.dispatchEvent(AddSkillCustomEvent());
    })

    const addLeaveTypeBtn = this.querySelector("#hr-options-add-leavetype");
    addLeaveTypeBtn.addEventListener("click", () => {
      this.dispatchEvent(AddLeaveTypeCustomEvent());
    })
    const { ok, data } = authState.GetCurrUserState();
    if (!ok) {
      window.location.href = "http://localhost:5000"
    }
    console.log(data);
    if (data.user.role !== "HR") {
      rootDiv.classList.add("hidden");
    }
  }



}
customElements.define("app-dashboard-hr", HROptionsDiv);
