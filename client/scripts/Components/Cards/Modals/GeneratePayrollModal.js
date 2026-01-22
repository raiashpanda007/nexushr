import { salaryHandler } from "../../../Core/startup.js";
import { CreatePayrollCustomEvent } from "../../../events.js";

const GeneratePayrollModalTemplate = document.createElement("template");
GeneratePayrollModalTemplate.innerHTML = `
  <div id="generate-payroll-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-lg font-semibold leading-6 text-slate-900" id="modal-title">Generate Payroll</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Create a payroll record for <span id="user-name" class="font-medium text-slate-900"></span>.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form id="generate-payroll-form" class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              
              <!-- Month & Year -->
              <div>
                <label for="month" class="block text-sm font-medium text-slate-700">Month</label>
                <select id="month" name="month" class="mt-1 block w-full rounded-lg border-slate-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm">
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>

              <div>
                <label for="year" class="block text-sm font-medium text-slate-700">Year</label>
                <select id="year" name="year" class="mt-1 block w-full rounded-lg border-slate-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm">
                  <!-- Years will be populated dynamically -->
                </select>
              </div>

              <!-- Salary Selection -->
              <div class="sm:col-span-2">
                <label for="salary-select" class="block text-sm font-medium text-slate-700">Select Salary Structure</label>
                <select id="salary-select" name="salary" class="mt-1 block w-full rounded-lg border-slate-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm">
                  <option value="" disabled selected>Loading salaries...</option>
                </select>
                <p id="salary-details" class="mt-2 text-sm text-slate-500 hidden"></p>
              </div>

              <!-- Bonuses -->
              <div class="sm:col-span-2 border rounded-lg p-4 border-slate-200">
                <h4 class="text-sm font-medium text-slate-900 mb-3">Bonuses</h4>
                <div class="flex gap-2 mb-3">
                  <input type="text" id="bonus-reason" placeholder="Reason" class="block w-full rounded-lg border-slate-300 py-2 px-3 text-sm focus:border-purple-500 focus:ring-purple-500">
                  <input type="number" id="bonus-amount" placeholder="Amount" min="0" class="block w-32 rounded-lg border-slate-300 py-2 px-3 text-sm focus:border-purple-500 focus:ring-purple-500">
                  <button type="button" id="add-bonus-btn" class="inline-flex justify-center rounded-lg border border-transparent bg-purple-100 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">Add</button>
                </div>
                <div class="max-h-32 overflow-y-auto border-t border-slate-100 pt-2">
                  <ul id="bonus-list" class="space-y-2 text-sm text-slate-600">
                    <!-- Bonus items -->
                  </ul>
                </div>
              </div>

              <!-- Deductions -->
              <div class="sm:col-span-2 border rounded-lg p-4 border-slate-200">
                <h4 class="text-sm font-medium text-slate-900 mb-3">Deductions</h4>
                <div class="flex gap-2 mb-3">
                  <input type="text" id="deduction-reason" placeholder="Reason" class="block w-full rounded-lg border-slate-300 py-2 px-3 text-sm focus:border-purple-500 focus:ring-purple-500">
                  <input type="number" id="deduction-amount" placeholder="Amount" min="0" class="block w-32 rounded-lg border-slate-300 py-2 px-3 text-sm focus:border-purple-500 focus:ring-purple-500">
                  <button type="button" id="add-deduction-btn" class="inline-flex justify-center rounded-lg border border-transparent bg-rose-100 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">Add</button>
                </div>
                <div class="max-h-32 overflow-y-auto border-t border-slate-100 pt-2">
                  <ul id="deduction-list" class="space-y-2 text-sm text-slate-600">
                    <!-- Deduction items -->
                  </ul>
                </div>
              </div>

              <!-- Final Pay -->
              <div class="sm:col-span-2 bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                <span class="text-sm font-medium text-slate-700">Final Pay</span>
                <span id="final-pay" class="text-xl font-bold text-slate-900">$0.00</span>
              </div>

            </div>
          </form>

          <!-- Footer -->
          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="button" id="submit-btn" class="inline-flex w-full justify-center rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto transition-colors">Generate Payroll</button>
            <button type="button" id="cancel-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

class GeneratePayrollModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(GeneratePayrollModalTemplate.content.cloneNode(true));
    this.user = null;
    this.salaries = [];
    this.bonuses = [];
    this.deductions = [];
    this.selectedSalary = null;
    this.saveFormData = null; // Will be set in connectedCallback
  }

  connectedCallback() {
    const modal = this.querySelector("#generate-payroll-modal");
    const form = this.querySelector("#generate-payroll-form");
    const cancelBtn = this.querySelector("#cancel-btn");
    const submitBtn = this.querySelector("#submit-btn");
    const yearSelect = this.querySelector("#year");
    const salarySelect = this.querySelector("#salary-select");
    const salaryDetails = this.querySelector("#salary-details");

    // Populate years
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      const option = document.createElement("option");
      option.value = currentYear - i;
      option.textContent = currentYear - i;
      yearSelect.appendChild(option);
    }

    // Session storage key
    const STORAGE_KEY = "generatePayrollForm";

    // Save form data to session storage
    this.saveFormData = () => {
      if (!this.user) return;
      const formData = new FormData(form);
      const data = {
        userId: this.user.id,
        month: formData.get("month"),
        year: formData.get("year"),
        selectedSalaryIndex: salarySelect.value,
        bonuses: this.bonuses,
        deductions: this.deductions
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
            if (data.month) this.querySelector("#month").value = data.month;
            if (data.year) yearSelect.value = data.year;
            if (data.selectedSalaryIndex && this.salaries.length > 0) {
              salarySelect.value = data.selectedSalaryIndex;
              this.selectedSalary = this.salaries[data.selectedSalaryIndex];
            }
            if (data.bonuses) this.bonuses = data.bonuses;
            if (data.deductions) this.deductions = data.deductions;
            this.renderBonuses();
            this.renderDeductions();
            this.calculateFinalPay();
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
    form.addEventListener('input', this.saveFormData);
    form.addEventListener('change', this.saveFormData);

    // Listen for open event
    document.addEventListener("open-generate-payroll-modal", async (e) => {
      this.user = e.detail;
      this.querySelector("#user-name").textContent = `${this.user.firstName} ${this.user.lastName}`;

      // Reset state
      this.bonuses = [];
      this.deductions = [];
      this.selectedSalary = null;
      this.renderBonuses();
      this.renderDeductions();
      this.calculateFinalPay();
      form.reset();
      salaryDetails.classList.add("hidden");
      salarySelect.innerHTML = '<option value="" disabled selected>Loading salaries...</option>';

      modal.classList.remove("hidden");

      // Fetch salaries
      const response = await salaryHandler.GetAllSalariesByUserID(this.user.id);
      console.log("salary response :: ", response)
      salarySelect.innerHTML = '';

      if (response.ok && response.data) {
        this.salaries = response.data.data;
        this.salaries.forEach((salary, index) => {
          const option = document.createElement("option");
          option.value = index;
          const total = (salary.base || 0) + (salary.hra || 0) + (salary.lta || 0);
          option.textContent = `Base: $${salary.base} + HRA: $${salary.hra} + LTA: $${salary.lta} = $${total}`;
          salarySelect.appendChild(option);
        });
        // Select first by default
        salarySelect.value = 0;
        this.selectedSalary = this.salaries[0];
        this.calculateFinalPay();

        // Restore form data after salaries are loaded
        setTimeout(() => restoreFormData(), 100);
      } else {
        const option = document.createElement("option");
        option.disabled = true;
        option.selected = true;
        option.textContent = "No salary structure found";
        salarySelect.appendChild(option);
      }
    });

    // Salary selection change
    salarySelect.addEventListener("change", (e) => {
      const index = e.target.value;
      this.selectedSalary = this.salaries[index];
      this.calculateFinalPay();
      this.saveFormData();
    });

    // Add Bonus
    this.querySelector("#add-bonus-btn").addEventListener("click", () => {
      const reasonInput = this.querySelector("#bonus-reason");
      const amountInput = this.querySelector("#bonus-amount");
      const reason = reasonInput.value.trim();
      const amount = parseFloat(amountInput.value);

      if (reason && !isNaN(amount) && amount > 0) {
        this.bonuses.push({ reason, amount });
        this.renderBonuses();
        this.calculateFinalPay();
        reasonInput.value = "";
        amountInput.value = "";
        this.saveFormData();
      }
    });

    // Add Deduction
    this.querySelector("#add-deduction-btn").addEventListener("click", () => {
      const reasonInput = this.querySelector("#deduction-reason");
      const amountInput = this.querySelector("#deduction-amount");
      const reason = reasonInput.value.trim();
      const amount = parseFloat(amountInput.value);

      if (reason && !isNaN(amount) && amount > 0) {
        this.deductions.push({ reason, amount });
        this.renderDeductions();
        this.calculateFinalPay();
        reasonInput.value = "";
        amountInput.value = "";
        this.saveFormData();
      }
    });

    // Close modal
    const closeModal = () => {
      modal.classList.add("hidden");
      this.user = null;
    };

    cancelBtn.addEventListener("click", closeModal);

    // Backdrop click
    const backdrop = this.querySelector(".fixed.inset-0.bg-slate-900\\/50");
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
      if (!this.selectedSalary) {
        alert("Please select a salary structure.");
        return;
      }

      const formData = new FormData(form);
      const month = formData.get("month");
      const year = parseInt(formData.get("year"));
      const total = this.calculateFinalPay(true); // Get raw value

      this.dispatchEvent(CreatePayrollCustomEvent({
        userId: this.user.id,
        userFirstName: this.user.firstName,
        userLastName: this.user.lastName,
        month,
        year,
        salary: this.selectedSalary,
        bonuses: this.bonuses,
        deductions: this.deductions,
        total
      }));
    });

    // Listen for success/error events
    this.addEventListener("create-payroll-success", () => {
      alert("Payroll generated successfully!");
      clearFormData(); // Clear session storage on success
      closeModal();
    });

    this.addEventListener("create-payroll-error", (e) => {
      alert("Failed to generate payroll: " + e.detail.error);
    });
  }

  renderBonuses() {
    const list = this.querySelector("#bonus-list");
    list.innerHTML = "";
    this.bonuses.forEach((bonus, index) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center";
      li.innerHTML = `
            <span>${bonus.reason}</span>
            <div class="flex items-center gap-2">
                <span class="font-medium text-emerald-600">+$${bonus.amount.toFixed(2)}</span>
                <button type="button" class="text-slate-400 hover:text-rose-500" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
          `;
      li.querySelector("button").addEventListener("click", () => {
        this.bonuses.splice(index, 1);
        this.renderBonuses();
        this.calculateFinalPay();
        this.saveFormData();
      });
      list.appendChild(li);
    });
  }

  renderDeductions() {
    const list = this.querySelector("#deduction-list");
    list.innerHTML = "";
    this.deductions.forEach((deduction, index) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center";
      li.innerHTML = `
            <span>${deduction.reason}</span>
            <div class="flex items-center gap-2">
                <span class="font-medium text-rose-600">-$${deduction.amount.toFixed(2)}</span>
                <button type="button" class="text-slate-400 hover:text-rose-500" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
          `;
      li.querySelector("button").addEventListener("click", () => {
        this.deductions.splice(index, 1);
        this.renderDeductions();
        this.calculateFinalPay();
        this.saveFormData();
      });
      list.appendChild(li);
    });
  }

  calculateFinalPay(returnRaw = false) {
    if (!this.selectedSalary) {
      this.querySelector("#final-pay").textContent = "$0.00";
      return 0;
    }

    const baseSalary = (this.selectedSalary.base || 0) + (this.selectedSalary.hra || 0) + (this.selectedSalary.lta || 0);
    const totalBonuses = this.bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);

    const finalPay = baseSalary + totalBonuses - totalDeductions;

    if (returnRaw) return finalPay;

    this.querySelector("#final-pay").textContent = `$${finalPay.toFixed(2)}`;
  }
}

customElements.define("app-generate-payroll-modal", GeneratePayrollModal);
