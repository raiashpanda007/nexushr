import { CreateSalaryCustomEvent } from "../../../events.js";

const AddSalaryModalTemplate = document.createElement("template");
AddSalaryModalTemplate.innerHTML = `
  <div id="add-salary-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-lg font-semibold leading-6 text-slate-900" id="modal-title">Add Salary</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Add salary details for <span id="user-name" class="font-medium text-slate-900"></span>.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form id="add-salary-form" class="px-4 py-5 sm:p-6">
            <div class="space-y-4">
              <div>
                <label for="base" class="block text-sm font-medium text-slate-700">Base Salary</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span class="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" name="base" id="base" required min="0" class="block w-full rounded-lg border-slate-300 pl-7 py-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="0.00">
                </div>
              </div>

              <div>
                <label for="hra" class="block text-sm font-medium text-slate-700">HRA</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span class="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" name="hra" id="hra" required min="0" class="block w-full rounded-lg border-slate-300 pl-7 py-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="0.00">
                </div>
              </div>

              <div>
                <label for="lta" class="block text-sm font-medium text-slate-700">LTA</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span class="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" name="lta" id="lta" required min="0" class="block w-full rounded-lg border-slate-300 pl-7 py-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="0.00">
                </div>
              </div>
            </div>
          </form>

          <!-- Footer -->
          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="button" id="submit-btn" class="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 sm:ml-3 sm:w-auto transition-colors">Add Salary</button>
            <button type="button" id="cancel-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

class AddSalaryModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(AddSalaryModalTemplate.content.cloneNode(true));
    this.user = null;
  }

  connectedCallback() {
    const modal = this.querySelector("#add-salary-modal");
    const form = this.querySelector("#add-salary-form");
    const cancelBtn = this.querySelector("#cancel-btn");
    const submitBtn = this.querySelector("#submit-btn");
    const backdrop = this.querySelector(".fixed.inset-0.bg-slate-900\\/50");

    // Session storage key
    const STORAGE_KEY = "addSalaryForm";

    // Save form data to session storage
    const saveFormData = () => {
      if (!this.user) return;
      const formData = new FormData(form);
      const data = {
        userId: this.user.id,
        base: formData.get("base"),
        hra: formData.get("hra"),
        lta: formData.get("lta")
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // Restore form data from session storage
    const restoreFormData = () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData && this.user) {
        try {
          const data = JSON.parse(savedData);
          // Only restore if it's for the same user
          if (data.userId === this.user.id) {
            if (data.base) form.querySelector("#base").value = data.base;
            if (data.hra) form.querySelector("#hra").value = data.hra;
            if (data.lta) form.querySelector("#lta").value = data.lta;
          }
        } catch (e) {
          console.error("Failed to restore form data:", e);
        }
      }
    };

    // Clear session storage
    const clearFormData = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    // Listen for input changes to save to session storage
    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);

    // Listen for open event
    document.addEventListener("open-add-salary-modal", (e) => {
      this.user = e.detail;
      this.querySelector("#user-name").textContent = `${this.user.firstName} ${this.user.lastName}`;
      form.reset();
      restoreFormData(); // Restore saved form data
      modal.classList.remove("hidden");
    });

    // Close modal
    const closeModal = () => {
      modal.classList.add("hidden");
      this.user = null;
    };

    cancelBtn.addEventListener("click", closeModal);

    // Backdrop click
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

    // Submit form
    submitBtn.addEventListener("click", () => {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const base = parseFloat(formData.get("base"));
      const hra = parseFloat(formData.get("hra"));
      const lta = parseFloat(formData.get("lta"));

      this.dispatchEvent(CreateSalaryCustomEvent({
        userId: this.user.id,
        base,
        hra,
        lta,
        userFirstName: this.user.firstName,
        userLastName: this.user.lastName,
        userDepartment: this.user.department ? this.user.department.name : (this.user.deptId || '-')
      }));
    });

    // Listen for success/error events to close modal or show error
    this.addEventListener("create-salary-success", () => {
      clearFormData(); // Clear session storage on success
      closeModal();
    });

    this.addEventListener("create-salary-error", (e) => {
      alert("Failed to add salary: " + e.detail.error);
    });
  }
}

customElements.define("app-add-salary-modal", AddSalaryModal);
