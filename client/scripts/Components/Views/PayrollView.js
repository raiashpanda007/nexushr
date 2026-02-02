import { payrollHandler, authState, userHandler } from "../../Core/startup.js";
import { CreatePayrollPDF } from "../../utils.js";

const monthMap = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
};

function SortPayrolls(payrolls, sortBy, direction = 'asc') {
    const modifier = direction === 'asc' ? 1 : -1;

    payrolls.sort((a, b) => {
        let valueA, valueB;

        switch (sortBy) {
            case "employee":
                valueA = ((a.userFirstName || '') + ' ' + (a.userLastName || '')).toLowerCase();
                valueB = ((b.userFirstName || '') + ' ' + (b.userLastName || '')).toLowerCase();
                break;
            case "period":
                // Create comparable value: Year * 100 + MonthNum
                const monthA = monthMap[a.month] || 0;
                const monthB = monthMap[b.month] || 0;
                valueA = (a.year || 0) * 100 + monthA;
                valueB = (b.year || 0) * 100 + monthB;
                break;
            case "base":
                valueA = (a.salary?.base || 0) + (a.salary?.hra || 0) + (a.salary?.lta || 0);
                valueB = (b.salary?.base || 0) + (b.salary?.hra || 0) + (b.salary?.lta || 0);
                break;
            case "bonuses":
                valueA = a.bonuses ? a.bonuses.reduce((sum, item) => sum + item.amount, 0) : 0;
                valueB = b.bonuses ? b.bonuses.reduce((sum, item) => sum + item.amount, 0) : 0;
                break;
            case "deductions":
                valueA = a.deductions ? a.deductions.reduce((sum, item) => sum + item.amount, 0) : 0;
                valueB = b.deductions ? b.deductions.reduce((sum, item) => sum + item.amount, 0) : 0;
                break;
            case "net":
                valueA = a.total || 0;
                valueB = b.total || 0;
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return -1 * modifier;
        if (valueA > valueB) return 1 * modifier;
        return 0;
    });

    return payrolls;
}
const PayrollViewTemplate = document.createElement("template");
PayrollViewTemplate.innerHTML = `
<div class="w-full max-w-7xl mx-auto mt-8 mb-8">
    <div class="bg-white rounded-2xl overflow-hidden border border-slate-200">
        <div class="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <h5 class="text-xl font-bold text-slate-800">Payroll Records</h5>
                <div class="text-sm text-slate-500">View and manage payrolls</div>
            </div>
            
            <div class="flex flex-wrap gap-3 items-center">
                <!-- Employee Filter (HR Only) -->
                <div id="employee-filter-container" class="hidden">
                    <select id="employee-filter" class="block w-48 rounded-lg border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500">
                        <option value="">All Employees</option>
                    </select>
                </div>

                <!-- Month Filter -->
                <select id="month-filter" class="block w-32 rounded-lg border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500">
                    <option value="">All Months</option>
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

                <!-- Year Filter -->
                <select id="year-filter" class="block w-32 rounded-lg border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500">
                    <option value="">All Years</option>
                </select>

                <button id="reset-filters" class="text-sm text-slate-500 hover:text-purple-600 font-medium">Reset</button>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50/50">
                    <tr>
                
                        <th scope="col" id="th-employee" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Employee
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-period" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Period
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-base" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Base Salary
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-bonuses" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Bonuses
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-deductions" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Deductions
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-net" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Net Pay
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-100" id="payroll-table-body">
                    <!-- Rows will be populated here -->
                </tbody>
            </table>
        </div>
    </div>
</div>`;

class PayrollView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(PayrollViewTemplate.content.cloneNode(true));
        this.payrolls = [];
        this.filteredPayrolls = [];
    }

    async connectedCallback() {
        this.sortState = { key: null, direction: 'asc' };

        const thEmployee = this.querySelector("#th-employee");
        const thPeriod = this.querySelector("#th-period");
        const thBase = this.querySelector("#th-base");
        const thBonuses = this.querySelector("#th-bonuses");
        const thDeductions = this.querySelector("#th-deductions");
        const thNet = this.querySelector("#th-net");

        const handleSort = (key) => {
            if (!this.filteredPayrolls || this.filteredPayrolls.length === 0) return;

            if (this.sortState.key === key) {
                this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortState.key = key;
                this.sortState.direction = 'asc';
            }

            this.filteredPayrolls = SortPayrolls(this.filteredPayrolls, this.sortState.key, this.sortState.direction);
            this.renderTable();

            // Update visual indicators
            const headers = {
                'employee': thEmployee,
                'period': thPeriod,
                'base': thBase,
                'bonuses': thBonuses,
                'deductions': thDeductions,
                'net': thNet
            };

            Object.values(headers).forEach(th => {
                if (!th) return;
                const span = th.querySelector('span');
                if (span) {
                    span.textContent = '⇅';
                    span.className = "inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity";
                }
                th.classList.remove('bg-slate-100');
            });

            const activeTh = headers[key];
            if (activeTh) {
                const span = activeTh.querySelector('span');
                if (span) {
                    span.textContent = this.sortState.direction === 'asc' ? '↑' : '↓';
                    span.className = "inline-block ml-1 opacity-100 text-slate-800";
                }
            }
        };

        if (thEmployee) thEmployee.addEventListener("click", () => handleSort("employee"));
        if (thPeriod) thPeriod.addEventListener("click", () => handleSort("period"));
        if (thBase) thBase.addEventListener("click", () => handleSort("base"));
        if (thBonuses) thBonuses.addEventListener("click", () => handleSort("bonuses"));
        if (thDeductions) thDeductions.addEventListener("click", () => handleSort("deductions"));
        if (thNet) thNet.addEventListener("click", () => handleSort("net"));

        const yearSelect = this.querySelector("#year-filter");
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 10; i++) {
            const option = document.createElement("option");
            option.value = currentYear - i;
            option.textContent = currentYear - i;
            yearSelect.appendChild(option);
        }

        this.setupFilters();
        await this.loadData();
        document.addEventListener("create-payroll-success", () => this.loadData());
    }

    setupFilters() {
        const monthFilter = this.querySelector("#month-filter");
        const yearFilter = this.querySelector("#year-filter");
        const employeeFilter = this.querySelector("#employee-filter");
        const resetBtn = this.querySelector("#reset-filters");

        const applyFilters = () => {
            const month = monthFilter.value;
            const year = yearFilter.value;
            const employeeId = employeeFilter.value;

            this.filteredPayrolls = this.payrolls.filter(p => {
                const matchMonth = !month || p.month === month;
                const matchYear = !year || p.year == year;
                const matchEmployee = !employeeId || p.userId === employeeId;
                return matchMonth && matchYear && matchEmployee;
            });

            // Re-apply current sort if active
            if (this.sortState.key) {
                this.filteredPayrolls = SortPayrolls(this.filteredPayrolls, this.sortState.key, this.sortState.direction);
            }

            this.renderTable();
        };

        monthFilter.addEventListener("change", applyFilters);
        yearFilter.addEventListener("change", applyFilters);
        employeeFilter.addEventListener("change", applyFilters);

        resetBtn.addEventListener("click", () => {
            monthFilter.value = "";
            yearFilter.value = "";
            employeeFilter.value = "";
            this.filteredPayrolls = [...this.payrolls];
            this.renderTable();
        });
    }

    async loadData() {
        const tbody = this.querySelector("#payroll-table-body");
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-500 py-8">Loading...</td></tr>';

        const { ok: authOk, data: authData } = authState.GetCurrUserState();
        if (!authOk || !authData) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-8">Authentication failed</td></tr>`;
            return;
        }

        const isHR = authData.user.role === "HR";
        const currentUserId = authData.user.id;

        // Setup Employee Filter for HR
        if (isHR) {
            const empFilterContainer = this.querySelector("#employee-filter-container");
            const empFilter = this.querySelector("#employee-filter");
            empFilterContainer.classList.remove("hidden");

            try {
                const userRes = await userHandler.GetAllUser();
                if (userRes.ok) {
                    let users = [];
                    if (Array.isArray(userRes.data)) users = userRes.data;
                    else if (userRes.data && Array.isArray(userRes.data.data)) users = userRes.data.data;

                    empFilter.innerHTML = '<option value="">All Employees</option>';
                    users.forEach(u => {
                        const option = document.createElement("option");
                        option.value = u.id;
                        option.textContent = `${u.firstName} ${u.lastName}`;
                        empFilter.appendChild(option);
                    });
                }
            } catch (err) {
                console.error("Failed to load users for filter", err);
            }
        }

        try {
            let response;
            if (isHR) {
                response = await payrollHandler.GetAllPayroll();
            } else {
                response = await payrollHandler.GetAllPayrollByUserId(currentUserId);
            }

            if (!response.ok) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-8">Failed to load payrolls: ${response.data}</td></tr>`;
                return;
            }

            this.payrolls = Array.isArray(response.data) ? response.data : (response.data.data || []);

            // Initial filter for EMP (though handler should handle it, double check)
            if (!isHR) {
                this.payrolls = this.payrolls.filter(p => p.userId === currentUserId);
            }

            this.filteredPayrolls = [...this.payrolls];
            this.renderTable();

        } catch (error) {
            console.error("Error loading payrolls:", error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose-500 py-8">Error loading payrolls</td></tr>`;
        }
    }

    renderTable() {
        const tbody = this.querySelector("#payroll-table-body");
        tbody.innerHTML = '';

        if (this.filteredPayrolls.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-slate-500 py-8">No payroll records found</td></tr>`;
            return;
        }

        this.filteredPayrolls.forEach(payroll => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50/80 transition-colors duration-150";



            // Employee
            const nameTd = document.createElement("td");
            nameTd.className = "px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900";
            nameTd.textContent = `${payroll.userFirstName} ${payroll.userLastName}`;
            tr.appendChild(nameTd);

            // Period
            const periodTd = document.createElement("td");
            periodTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
            periodTd.textContent = `${payroll.month} ${payroll.year}`;
            tr.appendChild(periodTd);

            // Base Salary (Total of components)
            const baseTd = document.createElement("td");
            baseTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
            const salaryTotal = (payroll.salary.base || 0) + (payroll.salary.hra || 0) + (payroll.salary.lta || 0);
            baseTd.textContent = `$${salaryTotal.toFixed(2)}`;
            tr.appendChild(baseTd);

            // Bonuses
            const bonusTd = document.createElement("td");
            bonusTd.className = "px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium";
            const bonusTotal = payroll.bonuses ? payroll.bonuses.reduce((sum, b) => sum + b.amount, 0) : 0;
            bonusTd.textContent = `+$${bonusTotal.toFixed(2)}`;
            tr.appendChild(bonusTd);

            // Deductions
            const deductionTd = document.createElement("td");
            deductionTd.className = "px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-medium";
            const deductionTotal = payroll.deductions ? payroll.deductions.reduce((sum, d) => sum + d.amount, 0) : 0;
            deductionTd.textContent = `-$${deductionTotal.toFixed(2)}`;
            tr.appendChild(deductionTd);

            // Net Pay
            const netTd = document.createElement("td");
            netTd.className = "px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900";
            netTd.textContent = `$${payroll.total.toFixed(2)}`;
            tr.appendChild(netTd);

            // Actions
            const actionsTd = document.createElement("td");
            actionsTd.className = "px-6 py-4 whitespace-nowrap text-sm font-medium";

            const printBtn = document.createElement("button");
            printBtn.textContent = "Print";
            printBtn.className = "text-white bg-slate-600 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow";
            printBtn.addEventListener("click", () => this.printPayroll(payroll));

            actionsTd.appendChild(printBtn);
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }

    printPayroll(payroll) {
        const salaryTotal = (payroll.salary.base || 0) + (payroll.salary.hra || 0) + (payroll.salary.lta || 0);
        const bonusTotal = payroll.bonuses ? payroll.bonuses.reduce((sum, b) => sum + b.amount, 0) : 0;
        const deductionTotal = payroll.deductions ? payroll.deductions.reduce((sum, d) => sum + d.amount, 0) : 0;

        CreatePayrollPDF(
            payroll.id,
            payroll.userFirstName,
            payroll.userLastName,
            payroll.month,
            payroll.year,
            salaryTotal,
            bonusTotal,
            deductionTotal,
            payroll.total
        );
    }
}

customElements.define("app-payroll-view", PayrollView);
