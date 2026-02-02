import { salaryHandler, authState } from "../../Core/startup.js";
import { OpenEditSalaryModalEvent } from "../../events.js";

function SortSalaries(salaries, sortBy, direction = 'asc') {
    const modifier = direction === 'asc' ? 1 : -1;
    salaries.sort((a, b) => {
        let valueA, valueB;
        switch (sortBy) {
            case "name":
                valueA = ((a.userFirstName || '') + ' ' + (a.userLastName || '')).toLowerCase();
                valueB = ((b.userFirstName || '') + ' ' + (b.userLastName || '')).toLowerCase();
                break;
            case "department":
                valueA = (a.userDepartment || '').toLowerCase();
                valueB = (b.userDepartment || '').toLowerCase();
                break;
            default:
                return 0;
        }
        if (valueA < valueB) return -1 * modifier;
        if (valueA > valueB) return 1 * modifier;
        return 0;
    });
    return salaries;
}
const SalariesViewTemplate = document.createElement("template");
SalariesViewTemplate.innerHTML = `
<div class="w-full max-w-7xl mx-auto mt-8 mb-8">
    <div class="bg-white rounded-2xl overflow-hidden border border-slate-200">
        <div class="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
            <h5 class="text-xl font-bold text-slate-800">All Salaries</h5>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50/50">
                    <tr>
                        <th scope="col" id="th-name" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Name
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-department" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Department
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Base</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">HRA</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">LTA</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" id="actions-header">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-100" id="salaries-table-body">
                    <!-- Rows will be populated here -->
                </tbody>
            </table>
        </div>
    </div>
</div>`;

class SalariesView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(SalariesViewTemplate.content.cloneNode(true));
    }

    async connectedCallback() {
        this.salaries = [];
        this.sortState = { key: null, direction: 'asc' };
        this.isHR = false;

        const thName = this.querySelector("#th-name");
        const thDepartment = this.querySelector("#th-department");

        const handleSort = (key) => {
            if (!this.salaries || this.salaries.length === 0) return;

            if (this.sortState.key === key) {
                this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortState.key = key;
                this.sortState.direction = 'asc';
            }

            this.salaries = SortSalaries(this.salaries, this.sortState.key, this.sortState.direction);
            this.renderTableRows();

            // Update visual indicators
            [thName, thDepartment].forEach(th => {
                const span = th.querySelector('span');
                if (span) span.textContent = '⇅';
                if (span) span.className = "inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity";
                th.classList.remove('bg-slate-100');
            });

            const activeTh = key === 'name' ? thName : thDepartment;
            if (activeTh) {
                const span = activeTh.querySelector('span');
                if (span) {
                    span.textContent = this.sortState.direction === 'asc' ? '↑' : '↓';
                    span.className = "inline-block ml-1 opacity-100 text-slate-800";
                }
            }
        };

        if (thName) thName.addEventListener("click", () => handleSort("name"));
        if (thDepartment) thDepartment.addEventListener("click", () => handleSort("department"));

        await this.renderSalaries();
        document.addEventListener("create-salary-success", () => this.renderSalaries());
        document.addEventListener("edit-salary-success", () => this.renderSalaries());
    }

    async renderSalaries() {
        const tbody = this.querySelector("#salaries-table-body");
        const actionsHeader = this.querySelector("#actions-header");
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-500 py-8">Loading...</td></tr>';

        const { ok: authOk, data: authData } = authState.GetCurrUserState();
        if (!authOk || !authData) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-8">Authentication failed</td></tr>`;
            return;
        }

        this.isHR = authData.user.role === "HR";
        const currentUserId = authData.user.id;

        if (!this.isHR) {
            actionsHeader.classList.add("hidden");
        } else {
            actionsHeader.classList.remove("hidden");
        }

        try {
            let response;
            if (this.isHR) {
                response = await salaryHandler.GetAllSalaries();
            } else {
                response = await salaryHandler.GetAllSalariesByUserID(currentUserId);
            }

            if (!response.ok) {
                console.error("Failed to fetch salaries", response);
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-8">Failed to load salaries: ${response.data}</td></tr>`;
                return;
            }

            if (Array.isArray(response.data)) {
                this.salaries = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                this.salaries = response.data.data;
            } else {
                this.salaries = [];
            }

            // Client-side filter just in case
            if (!this.isHR) {
                this.salaries = this.salaries.filter(s => s.userId === currentUserId);
            }

            if (this.sortState.key) {
                this.salaries = SortSalaries(this.salaries, this.sortState.key, this.sortState.direction);
            }

            this.renderTableRows();

        } catch (error) {
            console.error("Error fetching salaries:", error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose-500 py-8">Error loading salaries</td></tr>`;
        }
    }

    renderTableRows() {
        const tbody = this.querySelector("#salaries-table-body");
        tbody.innerHTML = '';

        if (!this.salaries || this.salaries.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-slate-500 py-8">No salaries found</td></tr>`;
            return;
        }

        this.salaries.forEach(salary => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50/80 transition-colors duration-150 group";

            // Name
            const nameTd = document.createElement("td");
            nameTd.className = "px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900";
            nameTd.textContent = `${salary.userFirstName || ''} ${salary.userLastName || ''}`;
            tr.appendChild(nameTd);

            // Department
            const deptTd = document.createElement("td");
            deptTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
            deptTd.textContent = salary.userDepartment || '-';
            tr.appendChild(deptTd);

            // Base
            const baseTd = document.createElement("td");
            baseTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
            baseTd.textContent = salary.base ? `$${salary.base.toFixed(2)}` : '-';
            tr.appendChild(baseTd);

            // HRA
            const hraTd = document.createElement("td");
            hraTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
            hraTd.textContent = salary.hra ? `$${salary.hra.toFixed(2)}` : '-';
            tr.appendChild(hraTd);

            // LTA
            const ltaTd = document.createElement("td");
            ltaTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
            ltaTd.textContent = salary.lta ? `$${salary.lta.toFixed(2)}` : '-';
            tr.appendChild(ltaTd);

            // Total
            const totalTd = document.createElement("td");
            totalTd.className = "px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600";
            const total = (salary.base || 0) + (salary.hra || 0) + (salary.lta || 0);
            totalTd.textContent = `$${total.toFixed(2)}`;
            tr.appendChild(totalTd);

            // Actions
            const actionsTd = document.createElement("td");
            actionsTd.className = "px-6 py-4 whitespace-nowrap text-sm font-medium";

            if (this.isHR) {
                const actionDiv = document.createElement("div");
                actionDiv.className = "flex space-x-2";

                const createBtn = (text, colorClass, hoverClass) => {
                    const btn = document.createElement("button");
                    btn.textContent = text;
                    btn.className = `text-white ${colorClass} ${hoverClass} px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow`;
                    return btn;
                };

                const editBtn = createBtn("Edit", "bg-blue-600", "hover:bg-blue-700");
                editBtn.addEventListener("click", () => {
                    this.dispatchEvent(OpenEditSalaryModalEvent(salary));
                });

                const deleteBtn = createBtn("Delete", "bg-rose-600", "hover:bg-rose-700");
                deleteBtn.addEventListener("click", async () => {
                    if (confirm(`Are you sure you want to delete salary for ${salary.userFirstName}?`)) {
                        const res = await salaryHandler.DeleteSalary(salary.id);
                        if (res.ok) {
                            alert("Salary deleted successfully");
                            this.renderSalaries();
                        } else {
                            alert("Failed to delete salary: " + res.data);
                        }
                    }
                });

                actionDiv.appendChild(editBtn);
                actionDiv.appendChild(deleteBtn);
                actionsTd.appendChild(actionDiv);
            } else {
                actionsTd.classList.add("hidden");
            }

            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }
}

customElements.define("app-salaries-view", SalariesView);
