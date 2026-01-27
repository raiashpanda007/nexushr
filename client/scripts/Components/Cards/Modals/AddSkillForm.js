import { CreateSkillCustomEvent } from "../../../events.js";

const AddSkillTemplate = document.createElement("template");

AddSkillTemplate.innerHTML = `
  <form id="add-skill-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div id="cancel-backdrop" class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="modal-panel">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 sm:mx-0 sm:h-10 sm:w-10">
                <!-- Sparkles Icon for Skill -->
                <svg class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">Add New Skill</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Define a new skill to track employee competencies.</p>
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
            <div id="add-skill-form" class="space-y-4">
              <div>
                <label for="skillName" class="block text-sm font-medium leading-6 text-slate-900">Skill Name</label>
                <div class="mt-2">
                  <input type="text" name="skillName" id="skill-name" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="e.g. React.js">
                </div>
              </div>
              
              <div>
                <label for="skillCategory" class="block text-sm font-medium leading-6 text-slate-900">Description</label>
                <div class="mt-2">
                  <input id="skillCategory" name="skillCategory" rows="3" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 transition-all placeholder:px-1" placeholder="Brief description of the skill..."></input>
                </div>
              </div>
              <span class="text-red-500 font-semibold hidden" id="errorSkillForm"></span>
            </div>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="submit" class="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 sm:ml-3 sm:w-auto transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">Create Skill</button>
            <button type="button" id="cancel-modal-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all duration-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </form>
`

class AddSkill extends HTMLElement {
  constructor() {
    super();
    this.appendChild(AddSkillTemplate.content.cloneNode(true));
  }
  connectedCallback() {
    const modal = this.querySelector("#add-skill-modal");
    const backdrop = this.querySelector("#modal-backdrop");
    const panel = this.querySelector("#modal-panel");
    const closeBtn = this.querySelector("#close-modal-btn");
    const cancelBtn = this.querySelector("#cancel-modal-btn");
    const skillCreationForm = this.querySelector('form');
    const errSkill = this.querySelector("#errorSkillForm");
    const cancelBackdrop = this.querySelector("#cancel-backdrop");
    // Session storage key
    const STORAGE_KEY = "addSkillForm";

    // Save form data to session storage
    const saveFormData = () => {
      const data = {
        skillName: skillCreationForm.skillName.value,
        skillCategory: skillCreationForm.skillCategory.value
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // Restore form data from session storage
    const restoreFormData = () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.skillName) skillCreationForm.skillName.value = data.skillName;
          if (data.skillCategory) skillCreationForm.skillCategory.value = data.skillCategory;
        } catch (e) {
          console.error("Failed to restore form data:", e);
        }
      }
    };

    // Clear session storage
    const clearFormData = () => {
      skillCreationForm.reset();
      sessionStorage.removeItem(STORAGE_KEY);

    };

    // Listen for input changes to save to session storage
    skillCreationForm.addEventListener('input', saveFormData);
    skillCreationForm.addEventListener('change', saveFormData);

    const openModal = () => {
      restoreFormData();
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

    document.addEventListener("add-skill-modal", () => {
      openModal();
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    panel.addEventListener("click", (e) => {  
      e.stopPropagation();
    });

    if (cancelBackdrop  ) {
      cancelBackdrop.addEventListener("click", closeModal);
    }
    if (backdrop) {
      backdrop.addEventListener("click", closeModal);
    }
    // ESC key to close modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    skillCreationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Submit event triggered :: ", e);
      const name = e.target[1].value.trim();
      const category = e.target[2].value.trim();

      if (!name || !category) {
        errSkill.classList.remove("hidden");
        errSkill.textContent = "Please fill in all fields with valid values.";
        return;
      }

      this.dispatchEvent(CreateSkillCustomEvent(name, category));
    })

    this.addEventListener("create-skill-err", (event) => {
      console.log("Error caught :: ", event);
      errSkill.classList.remove("hidden");
      errSkill.textContent = event.detail.error;
    })
    this.addEventListener("create-skill-success", () => {
      console.log("Create skill success event triggered ... ")
      clearFormData();
      closeModal();
    })
  }
}
customElements.define("app-add-skill-modal", AddSkill);
