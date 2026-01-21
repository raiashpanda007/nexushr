import { AddLeaveTypeCustomEvent } from "../../events.js";
import "../Cards/Modals/AddLeaveTypeForm.js";

const LeavesViewTemplate = document.createElement("template");
LeavesViewTemplate.innerHTML = `
    <div class="w-full max-w-7xl mx-auto p-6">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Leaves</h2>
                <p class="text-slate-500">Manage leave policies and types</p>
            </div>
            <button id="add-leavetype-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Leave Type
            </button>
        </div>
        
        <!-- Placeholder for Leave Types List -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900">No leave types found</h3>
            <p class="text-slate-500 mt-1">Configure leave types for your organization.</p>
        </div>

        <app-add-leave-type-modal></app-add-leave-type-modal>
    </div>
`;

class LeavesView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(LeavesViewTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        this.querySelector("#add-leavetype-btn").addEventListener("click", () => {
            this.dispatchEvent(AddLeaveTypeCustomEvent());
        });
    }
}

customElements.define("app-leaves-view", LeavesView);
