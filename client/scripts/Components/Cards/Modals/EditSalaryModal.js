import { EditSalaryCustomEvent } from "../../../events.js";

const EditSalaryModalTemplate = document.createElement("template");
EditSalaryModalTemplate.innerHTML = `
  <div id="edit-salary-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-lg font-semibold leading-6 text-slate-900" id="modal-title">Edit Salary</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Update salary details for <span id="user-name" class="font-medium text-slate-900"></span>.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form id="edit-salary-form" class="px-4 py-5 sm:p-6">
            <input type="hidden" name="id" id="salary-id">
            <div class="space-y-4">
              <div>
                <label for="base" class="block text-sm font-medium text-slate-700">Base Salary</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span class="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" name="base" id="base" required min="0" class="block w-full rounded-lg border-slate-300 pl-7 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0.00">
                </div>
              </div>

              <div>
                <label for="hra" class="block text-sm font-medium text-slate-700">HRA</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span class="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" name="hra" id="hra" required min="0" class="block w-full rounded-lg border-slate-300 pl-7 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0.00">
                </div>
              </div>

              <div>
                <label for="lta" class="block text-sm font-medium text-slate-700">LTA</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span class="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" name="lta" id="lta" required min="0" class="block w-full rounded-lg border-slate-300 pl-7 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0.00">
                </div>
              </div>
            </div>
          </form>

          <!-- Footer -->
          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="button" id="submit-btn" class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition-colors">Update Salary</button>
            <button type="button" id="cancel-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

class EditSalaryModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(EditSalaryModalTemplate.content.cloneNode(true));
    this.salary = null;
  }

  connectedCallback() {
    const modal = this.querySelector("#edit-salary-modal");
    const form = this.querySelector("#edit-salary-form");
    const cancelBtn = this.querySelector("#cancel-btn");
    const submitBtn = this.querySelector("#submit-btn");
    const backdrop = this.querySelector(".fixed.inset-0.bg-slate-900\\/50");

    // Session storage key
    const STORAGE_KEY = "editSalaryForm";

    // Save form data to session storage
    const saveFormData = () => {
      if (!this.salary) return;
      const data = {
        salaryId: this.salary.id,
        base: form.querySelector("#base").value,
        hra: form.querySelector("#hra").value,
        lta: form.querySelector("#lta").value
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // Restore form data from session storage
    const restoreFormData = () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData && this.salary) {
        try {
          const data = JSON.parse(savedData);
          // Only restore if it's for the same salary
          if (data.salaryId === this.salary.id) {
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
    document.addEventListener("open-edit-salary-modal", (e) => {
      this.salary = e.detail;
      this.querySelector("#user-name").textContent = `${this.salary.userFirstName} ${this.salary.userLastName}`;

      form.querySelector("#salary-id").value = this.salary.id;
      form.querySelector("#base").value = this.salary.base;
      form.querySelector("#hra").value = this.salary.hra;
      form.querySelector("#lta").value = this.salary.lta;

      // Restore saved form data after initial load
      setTimeout(() => restoreFormData(), 100);

      modal.classList.remove("hidden");
    });

    // Close modal
    const closeModal = () => {
      modal.classList.add("hidden");
      this.salary = null;
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
      const id = formData.get("id");
      const base = parseFloat(formData.get("base"));
      const hra = parseFloat(formData.get("hra"));
      const lta = parseFloat(formData.get("lta"));

      this.dispatchEvent(EditSalaryCustomEvent({
        id,
        base,
        hra,
        lta
      }));
    });

    // Listen for success/error events to close modal or show error
    this.addEventListener("edit-salary-success", () => {
      clearFormData(); // Clear session storage on success
      closeModal();
    });

    this.addEventListener("edit-salary-error", (e) => {
      alert("Failed to update salary: " + e.detail.error);
    });
  }
}

customElements.define("app-edit-salary-modal", EditSalaryModal);
