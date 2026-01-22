import { CreateDepartmentCustomEvent } from "../../../events.js";

const AddDepartmentTemplate = document.createElement("template");

AddDepartmentTemplate.innerHTML = `
  <form id="add-department-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="modal-panel">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">Add New Department</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Create a new department for your organization.</p>
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
            <div id="add-dept-form" class="space-y-4">
              <div>
                <label for="deptName" class="block text-sm font-medium leading-6 text-slate-900">Department Name</label>
                <div class="mt-2">
                  <input type="text" name="deptName" id="deptName" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="e.g. Engineering">
                </div>
              </div>

              <div>
                <label for="deptDesc" class="block text-sm font-medium leading-6 text-slate-900">Description</label>
                <div class="mt-2">
                  <textarea id="deptDesc" name="deptDesc" rows="3" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:px-1" placeholder="Brief description of the department..."></textarea>
                </div>
              </div>
              <span class="text-red-500 font-semibold hidden" id="errorDeptForm"></span>
            </div>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="submit" class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">Create Department</button>
            <button type="button" id="cancel-modal-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all duration-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </form>
`;

const STORAGE_KEY = "addDepartmentForm";

class AddDepartment extends HTMLElement {
  constructor() {
    super();
    this.appendChild(AddDepartmentTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    const modal = this.querySelector("#add-department-modal");
    const backdrop = this.querySelector("#modal-backdrop");
    const panel = this.querySelector("#modal-panel");
    const closeBtn = this.querySelector("#close-modal-btn");
    const cancelBtn = this.querySelector("#cancel-modal-btn");
    const deptCreationForm = this.querySelector('form');
    const errDept = this.querySelector("#errorDeptForm");

    // Restore form data from session storage
    const restoreFormData = () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.deptName) deptCreationForm.deptName.value = data.deptName;
          if (data.deptDesc) deptCreationForm.deptDesc.value = data.deptDesc;
        } catch (e) {
          console.error("Failed to restore form data:", e);
        }
      }
    };

    // Save form data to session storage
    const saveFormData = () => {
      const data = {
        deptName: deptCreationForm.deptName.value,
        deptDesc: deptCreationForm.deptDesc.value
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // Clear session storage
    const clearFormData = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    const openModal = () => {
      restoreFormData();
      modal.classList.remove("hidden");
      errDept.classList.add("hidden");
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

    document.addEventListener("add-department-modal", () => {
      openModal();
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    // Listen for input changes to save to session storage
    deptCreationForm.addEventListener('input', saveFormData);
    deptCreationForm.addEventListener('change', saveFormData);

    // Close on backdrop click
    backdrop.addEventListener("click", closeModal);

    // ESC key to close modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    deptCreationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Submit event triggered :: ", e);
      const name = deptCreationForm.deptName.value.trim();
      const desc = deptCreationForm.deptDesc.value.trim();

      if (!name || !desc) {
        errDept.classList.remove("hidden");
        errDept.textContent = "Please fill in all fields with valid values.";
        return;
      }

      this.dispatchEvent(CreateDepartmentCustomEvent(name, desc));
    });

    this.addEventListener("create-dept-err", (event) => {
      console.log("Error caught :: ", event);
      errDept.classList.remove("hidden");
      errDept.textContent = event.detail.error;
    });

    this.addEventListener("create-dept-success", () => {
      clearFormData();
      deptCreationForm.reset();
      closeModal();
    });
  }
}

customElements.define("app-add-dept-modal", AddDepartment);
