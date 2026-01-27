import { CreateLeaveTypeCustomEvent } from "../../../events.js";

const AddLeaveTypeTemplate = document.createElement("template");

AddLeaveTypeTemplate.innerHTML = `
  <form id="add-leave-type-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div id="cancel-backdrop" class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="modal-panel">
          
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">Add Leave Type</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Configure a new leave type for time-off policies.</p>
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
            <div id="add-leave-type-form" class="space-y-4">
              <div>
                <label for="leaveTypeName" class="block text-sm font-medium leading-6 text-slate-900">Leave Type Name</label>
                <div class="mt-2">
                  <input type="text" name="leaveTypeName" id="leave-type-name" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="e.g. Sick Leave">
                </div>
              </div>
              
              <div>
                <label for="leaveTypeCode" class="block text-sm font-medium leading-6 text-slate-900">Leave Code</label>
                <div class="mt-2">
                  <input type="text" name="leaveTypeCode" id="leave-type-code" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="e.g. SL, CL, PL">
                </div>
              </div>

              <div>
                <label for="leaveLength" class="block text-sm font-medium leading-6 text-slate-900">Length of Leave</label>
                <div class="mt-2">
                  <select id="leave-length" name="leaveLength" class="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 transition-all p-2">
                    <option value="full">Full Day</option>
                    <option value="half">Half Day</option>
                  </select>
                </div>
              </div>
              <span class="text-red-500 font-semibold hidden" id="errorLeaveTypeForm"></span>
            </div>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="submit" class="inline-flex w-full justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 sm:ml-3 sm:w-auto transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">Create Leave Type</button>
            <button type="button" id="cancel-modal-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all duration-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </form>
`

class AddLeaveType extends HTMLElement {
  constructor() {
    super();
    this.appendChild(AddLeaveTypeTemplate.content.cloneNode(true));
  }
  connectedCallback() {
    const modal = this.querySelector("#add-leave-type-modal");
    const backdrop = this.querySelector("#modal-backdrop");
    const panel = this.querySelector("#modal-panel");
    const closeBtn = this.querySelector("#close-modal-btn");
    const cancelBtn = this.querySelector("#cancel-modal-btn");
    const leaveTypeForm = this.querySelector('form');
    const errLeaveType = this.querySelector("#errorLeaveTypeForm");
    const cancelBackdrop = this.querySelector("#cancel-backdrop");
    // Session storage key
    const STORAGE_KEY = "addLeaveTypeForm";

    // Restore form data from session storage
    const restoreFormData = () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.leaveTypeName) leaveTypeForm.leaveTypeName.value = data.leaveTypeName;
          if (data.leaveTypeCode) leaveTypeForm.leaveTypeCode.value = data.leaveTypeCode;
          if (data.leaveLength) leaveTypeForm.leaveLength.value = data.leaveLength;
        } catch (e) {
          console.error("Failed to restore form data:", e);
        }
      }
    };

    // Save form data to session storage
    const saveFormData = () => {
      const data = {
        leaveTypeName: leaveTypeForm.leaveTypeName.value,
        leaveTypeCode: leaveTypeForm.leaveTypeCode.value,
        leaveLength: leaveTypeForm.leaveLength.value
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    

    const clearFormData = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    restoreFormData();

    const openModal = () => {
      restoreFormData(); // Restore saved form data
      modal.classList.remove("hidden");
      errLeaveType.classList.add("hidden");
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


    panel.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    cancelBackdrop.addEventListener("click", closeModal);

    if(backdrop) {
      backdrop.addEventListener("click", closeModal);
    }

    document.addEventListener("add-leave-type-modal", () => {
      openModal();
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    // Listen for input changes to save to session storage
    leaveTypeForm.addEventListener('input', saveFormData);
    leaveTypeForm.addEventListener('change', saveFormData);

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

    leaveTypeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Submit event triggered :: ", e);
      const name = e.target[1].value.trim();
      const code = e.target[2].value.trim();
      const length = e.target[3].value;

      if (!name || !code) {
        errLeaveType.classList.remove("hidden");
        errLeaveType.textContent = "Please fill in all fields with valid values.";
        return;
      }

      this.dispatchEvent(CreateLeaveTypeCustomEvent(name, code, length));
    })

    this.addEventListener("create-leave-type-err", (event) => {
      console.log("Error caught :: ", event);
      errLeaveType.classList.remove("hidden");
      errLeaveType.textContent = event.detail.error;
    })
    this.addEventListener("create-leave-type-success", () => {
      clearFormData(); // Clear session storage on success
      leaveTypeForm.reset();
      closeModal();
    })
  }
}
customElements.define("app-add-leave-type-modal", AddLeaveType);
