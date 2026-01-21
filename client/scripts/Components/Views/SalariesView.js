import { salaryHandler, authState } from "../../Core/startup.js";
import { OpenEditSalaryModalEvent } from "../../events.js";

const SalariesViewTemplate = document.createElement("template");
SalariesViewTemplate.innerHTML = `
<div class="w-full max-w-7xl mx-auto mt-8 mb-8">
    <div class="bg-white rounded-2xl overflow-hidden border border-slate-200">
        <div class="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
            <h5 class="text-xl font-bold text-slate-800">All Salaries</h5>
            <div class="text-sm text-slate-500">Manage employee salaries</div>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50/50">
                    <tr>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary ID</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
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
        console.log("Salaries page should appear");
    }

    async connectedCallback() {
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

        const isHR = authData.user.role === "HR";
        const currentUserId = authData.user.id;

        if (!isHR) {
            actionsHeader.classList.add("hidden");
        } else {
            actionsHeader.classList.remove("hidden");
        }

        try {
            // For EMP, we might need to use a different method if the backend restricted GetAllSalaries
            // But based on previous instructions, we filter on client side.
            // However, SalaryHandler.GetAllSalaries checks for HR role.
            // We need to use GetAllSalariesByUserID for EMP or update GetAllSalaries to allow EMP.
            // Since the user said "he should be able to see only his salary you can do filter on client page", 
            // implies we might fetch all and filter, BUT the handler restricts it.
            // Let's check SalaryHandler.GetAllSalaries again. It restricts to HR.
            // So for EMP we must use GetAllSalariesByUserID(currentUserId) or similar if available.
            // SalaryHandler has GetAllSalariesByUserID(userId).

            let response;
            if (isHR) {
                response = await salaryHandler.GetAllSalaries();
            } else {
                response = await salaryHandler.GetAllSalariesByUserID(currentUserId);
            }

            console.log("response :: ", response);
            if (!response.ok) {
                console.error("Failed to fetch salaries", response);
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-8">Failed to load salaries: ${response.data}</td></tr>`;
                return;
            }

            let salaries = [];
            if (Array.isArray(response.data)) {
                salaries = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                salaries = response.data.data;
            } else {
                salaries = [];
            }

            // Client-side filter just in case, though handler logic should handle it
            if (!isHR) {
                salaries = salaries.filter(s => s.userId === currentUserId);
            }

            if (!salaries || salaries.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-slate-500 py-8">No salaries found</td></tr>`;
                return;
            }

            tbody.innerHTML = '';

            salaries.forEach(salary => {
                const tr = document.createElement("tr");
                tr.className = "hover:bg-slate-50/80 transition-colors duration-150 group";

                // Salary ID
                const idTd = document.createElement("td");
                idTd.className = "px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono";
                idTd.textContent = salary.id.substring(0, 8) + '...';
                idTd.title = salary.id;
                tr.appendChild(idTd);

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

                if (isHR) {
                    const actionDiv = document.createElement("div");
                    actionDiv.className = "flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200";

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

        } catch (error) {
            console.error("Error fetching salaries:", error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose-500 py-8">Error loading salaries</td></tr>`;
        }
    }
}

customElements.define("app-salaries-view", SalariesView);
