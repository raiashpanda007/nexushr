import { AddSkillCustomEvent, OpenEditSkillModalEvent } from "../../events.js";
import { skillHandler } from "../../Core/startup.js";
import "../Cards/Modals/AddSkillForm.js";
import "../Cards/Modals/EditSkillModal.js";

const SkillsViewTemplate = document.createElement("template");
SkillsViewTemplate.innerHTML = `
    <div class="w-full max-w-7xl mx-auto p-6">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Skills</h2>
                <p class="text-slate-500">Manage employee skills and competencies</p>
            </div>
            <button id="add-skill-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Skill
            </button>
        </div>
        
        <div id="skills-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Skills will be injected here -->
        </div>

        <div id="no-skills" class="hidden bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900">No skills found</h3>
            <p class="text-slate-500 mt-1">Define skills to track employee competencies.</p>
        </div>

        <app-add-skill-modal></app-add-skill-modal>
        <app-edit-skill-modal></app-edit-skill-modal>
    </div>
`;

class SkillsView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(SkillsViewTemplate.content.cloneNode(true));
    }

    async connectedCallback() {
        this.querySelector("#add-skill-btn").addEventListener("click", () => {
            this.dispatchEvent(AddSkillCustomEvent());
        });

        await this.renderSkills();

        // Listen for updates to refresh list
        document.addEventListener("create-skill-success", () => this.renderSkills());
        document.addEventListener("edit-skill-success", () => this.renderSkills());
    }

    async renderSkills() {
        const listContainer = this.querySelector("#skills-list");
        const noDataContainer = this.querySelector("#no-skills");

        listContainer.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">Loading...</div>';

        const { ok, data } = await skillHandler.GetAllSkills();

        listContainer.innerHTML = '';

        if (!ok || !data || data.length === 0) {
            listContainer.classList.add("hidden");
            noDataContainer.classList.remove("hidden");
            return;
        }

        listContainer.classList.remove("hidden");
        noDataContainer.classList.add("hidden");

        data.forEach(skill => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-xl border border-slate-200 p-6 transition-colors group relative";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-purple-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
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
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">${skill.name}</h3>
                <p class="text-sm text-slate-500">Category: <span class="font-medium text-slate-700">${skill.category || "General"}</span></p>
                <div class="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-400">
                    <span>Created: ${new Date(skill.createdAt).toLocaleDateString()}</span>
                </div>
            `;

            card.querySelector(".edit-btn").addEventListener("click", () => {
                this.dispatchEvent(OpenEditSkillModalEvent(skill));
            });

            card.querySelector(".delete-btn").addEventListener("click", async () => {
                if (confirm(`Are you sure you want to delete ${skill.name}?`)) {
                    const res = await skillHandler.DeleteSkill(skill.id);
                    if (res.ok) {
                        this.renderSkills();
                    } else {
                        alert("Failed to delete skill: " + res.data);
                    }
                }
            });

            listContainer.appendChild(card);
        });
    }
}

customElements.define("app-skills-view", SkillsView);
