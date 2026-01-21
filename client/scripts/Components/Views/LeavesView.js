import { AddLeaveTypeCustomEvent, OpenEditLeaveTypeModalEvent } from "../../events.js";
import { leaveTypeHandler, authState } from "../../Core/startup.js";
import "../Cards/Modals/AddLeaveTypeForm.js";
import "../Cards/Modals/EditLeaveTypeModal.js";

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
        
        <div id="leavetypes-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Leave Types will be injected here -->
        </div>

        <div id="no-leavetypes" class="hidden bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900">No leave types found</h3>
            <p class="text-slate-500 mt-1">Configure leave types for your organization.</p>
        </div>

        <app-add-leave-type-modal></app-add-leave-type-modal>
        <app-edit-leave-type-modal></app-edit-leave-type-modal>
    </div>
`;

class LeavesView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(LeavesViewTemplate.content.cloneNode(true));
    }

    async connectedCallback() {
        const { ok, data } = authState.GetCurrUserState();
        const isHR = ok && data && data.user && data.user.role === "HR";

        if (!isHR) {
            const btn = this.querySelector("#add-leavetype-btn");
            if (btn) btn.style.display = "none";
        }

        this.querySelector("#add-leavetype-btn").addEventListener("click", () => {
            this.dispatchEvent(AddLeaveTypeCustomEvent());
        });

        await this.renderLeaveTypes(isHR);

        // Listen for updates to refresh list
        document.addEventListener("create-leave-type-success", () => this.renderLeaveTypes(isHR));
        document.addEventListener("edit-leave-type-success", () => this.renderLeaveTypes(isHR));
    }

    async renderLeaveTypes(isHR) {
        const listContainer = this.querySelector("#leavetypes-list");
        const noDataContainer = this.querySelector("#no-leavetypes");

        listContainer.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">Loading...</div>';

        const { ok, data } = await leaveTypeHandler.GetAllLeaveTypes();
        console.log("Leave types field :: ", data);
        listContainer.innerHTML = '';

        if (!ok || !data || data.length === 0) {
            listContainer.classList.add("hidden");
            noDataContainer.classList.remove("hidden");
            return;
        }

        listContainer.classList.remove("hidden");
        noDataContainer.classList.add("hidden");

        data.forEach(leaveType => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-xl border border-slate-200 p-6 transition-colors group relative";

            let actionsHtml = '';
            if (isHR) {
                actionsHtml = `
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-btn p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button class="delete-btn p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-emerald-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    ${actionsHtml}
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">${leaveType.name}</h3>
                <div class="flex items-center gap-2 mt-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Code: ${leaveType.code}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leaveType.length === 'full' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                        ${leaveType.length === 'full' ? 'Full Day' : 'Half Day'}
                    </span>
                </div>
            `;

            if (isHR) {
                card.querySelector(".edit-btn").addEventListener("click", () => {
                    this.dispatchEvent(OpenEditLeaveTypeModalEvent(leaveType));
                });

                card.querySelector(".delete-btn").addEventListener("click", async () => {
                    if (confirm(`Are you sure you want to delete ${leaveType.name}?`)) {
                        const res = await leaveTypeHandler.DeleteLeaveType(leaveType.id);
                        if (res.ok) {
                            this.renderLeaveTypes(isHR);
                        } else {
                            alert("Failed to delete leave type: " + res.data);
                        }
                    }
                });
            }

            listContainer.appendChild(card);
        });
    }
}

customElements.define("app-leaves-view", LeavesView);
