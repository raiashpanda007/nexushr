import { EditSkillCustomEvent } from "../../../events.js";

const EditSkillTemplate = document.createElement("template");

EditSkillTemplate.innerHTML = `
  <form id="edit-skill-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="modal-panel">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">Edit Skill</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Update skill details.</p>
                </div>
              </div>
              <button type="button" id="close-modal-btn" class="absolute top-4 right-4 text-slate-400 hover:text-slate-500 transition-colors">
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="bg-white px-4 py-6 sm:p-6">
            <div id="edit-skill-form" class="space-y-4">
              <input type="hidden" id="skill-id" name="skillId">
              <div>
                <label for="skillName" class="block text-sm font-medium leading-6 text-slate-900">Skill Name</label>
                <div class="mt-2">
                  <input type="text" name="skillName" id="skill-name" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" required>
                </div>
              </div>
              
              <div>
                <label for="skillCategory" class="block text-sm font-medium leading-6 text-slate-900">Category</label>
                <div class="mt-2">
                  <input type="text" name="skillCategory" id="skill-category" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" required>
                </div>
              </div>
              <span class="text-red-500 font-semibold hidden" id="errorSkillForm"></span>
            </div>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="submit" class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">Save Changes</button>
            <button type="button" id="cancel-modal-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all duration-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </form>
`;

class EditSkill extends HTMLElement {
  constructor() {
    super();
    this.appendChild(EditSkillTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    const modal = this.querySelector("#edit-skill-modal");
    const backdrop = this.querySelector("#modal-backdrop");
    const panel = this.querySelector("#modal-panel");
    const closeBtn = this.querySelector("#close-modal-btn");
    const cancelBtn = this.querySelector("#cancel-modal-btn");
    const form = this.querySelector('form');
    const errSkill = this.querySelector("#errorSkillForm");

    const openModal = (skill) => {
      form.skillId.value = skill.id;
      form.skillName.value = skill.name;
      form.skillCategory.value = skill.category || "";

      modal.classList.remove("hidden");
      errSkill.classList.add("hidden");
      requestAnimationFrame(() => {
        backdrop.classList.remove("opacity-0");
        panel.classList.remove("opacity-0", "translate-y-4", "sm:translate-y-0", "sm:scale-95");
        panel.classList.add("opacity-100", "translate-y-0", "sm:scale-100");
      });
    };

    const closeModal = () => {
      backdrop.classList.add("opacity-0");
      panel.classList.remove("opacity-100", "translate-y-0", "sm:scale-100");
      panel.classList.add("opacity-0", "translate-y-4", "sm:translate-y-0", "sm:scale-95");

      setTimeout(() => {
        modal.classList.add("hidden");
      }, 300);
    };

    document.addEventListener("open-edit-skill-modal", (e) => {
      openModal(e.detail.skill);
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    if (backdrop) {
      backdrop.addEventListener("click", closeModal);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.skillName.value.trim();
      const category = form.skillCategory.value.trim();

      if (!name || !category) {
        errSkill.classList.remove("hidden");
        errSkill.textContent = "Please fill in all fields with valid values.";
        return;
      }

      this.dispatchEvent(EditSkillCustomEvent(
        form.skillId.value,
        name,
        category
      ));
    });

    this.addEventListener("edit-skill-err", (event) => {
      errSkill.classList.remove("hidden");
      errSkill.textContent = event.detail.error;
    });

    this.addEventListener("edit-skill-success", () => {
      closeModal();
    });
  }
}

customElements.define("app-edit-skill-modal", EditSkill);
