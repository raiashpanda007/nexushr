import { userHandler } from "../../Core/startup.js";
import { OpenEditUserModalEvent, OpenAddSalaryModalEvent, OpenGeneratePayrollModalEvent, OpenViewUserModalEvent } from "../../events.js";
import "./Modals/AddSalaryModal.js";
import "./Modals/GeneratePayrollModal.js";
import "./Modals/ViewUserModal.js";







function SortUsers(users, sortBy, direction = 'asc') {
    const modifier = direction === 'asc' ? 1 : -1;

    users.sort((a, b) => {
        let valueA, valueB;

        switch (sortBy) {
            case "name":
                valueA = (a.firstName || '').toLowerCase();
                valueB = (b.firstName || '').toLowerCase();
                break;
            case "email":
                valueA = (a.email || '').toLowerCase();
                valueB = (b.email || '').toLowerCase();
                break;
            case "department":
                valueA = (a.department?.name || '').toLowerCase();
                valueB = (b.department?.name || '').toLowerCase();
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return -1 * modifier;
        if (valueA > valueB) return 1 * modifier;
        return 0;
    });

    return users;
}

// ... existing RenderUsers ...




function RenderUsers(users, tbody) {
    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 transition-colors duration-150 group";

        // Profile Photo
        const photoTd = document.createElement("td");
        photoTd.className = "px-6 py-4 whitespace-nowrap";
        const imgContainer = document.createElement("div");
        imgContainer.className = "h-10 w-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden";
        const img = document.createElement("img");
        img.className = "h-full w-full object-cover";

        if (user.profilePhoto) {
            try {
                if (user.profilePhoto instanceof Blob || user.profilePhoto instanceof File) {
                    img.src = URL.createObjectURL(user.profilePhoto);
                } else {
                    img.src = user.profilePhoto;
                }
            } catch (e) {
                img.src = "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent((user.firstName || 'U') + ' ' + (user.lastName || ''));
            }
        } else {
            img.src = "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent((user.firstName || 'U') + ' ' + (user.lastName || ''));
        }
        imgContainer.appendChild(img);
        photoTd.appendChild(imgContainer);
        tr.appendChild(photoTd);

        // Name
        const nameTd = document.createElement("td");
        nameTd.className = "px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900";
        nameTd.textContent = `${user.firstName || ''} ${user.lastName || ''}`;
        tr.appendChild(nameTd);

        // Email
        const emailTd = document.createElement("td");
        emailTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
        emailTd.textContent = user.email || '';
        tr.appendChild(emailTd);

        // Department
        const deptTd = document.createElement("td");
        deptTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
        deptTd.textContent = user.department ? user.department.name : (user.deptId || '-');
        tr.appendChild(deptTd);

        // Skills
        const skillsTd = document.createElement("td");
        skillsTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500";
        if (Array.isArray(user.skills)) {
            skillsTd.textContent = user.skills.map(s => s.name || s).join(", ");
        } else if (typeof user.skills === 'string') {
            skillsTd.textContent = user.skills;
        } else {
            skillsTd.textContent = '-';
        }
        tr.appendChild(skillsTd);

        // Note
        const noteTd = document.createElement("td");
        noteTd.className = "px-6 py-4 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate";
        noteTd.textContent = user.note || '-';
        tr.appendChild(noteTd);

        // Online
        const onlineTd = document.createElement("td");
        onlineTd.className = "px-6 py-4 whitespace-nowrap";
        const onlineSpan = document.createElement("span");
        onlineSpan.className = `px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${user.online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`;
        onlineSpan.textContent = user.online ? 'Online' : 'Offline';
        onlineTd.appendChild(onlineSpan);
        tr.appendChild(onlineTd);

        // Actions
        const actionsTd = document.createElement("td");
        actionsTd.className = "px-6 py-4 whitespace-nowrap text-sm font-medium";

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
            this.dispatchEvent(OpenEditUserModalEvent(user));
        });
        const salaryBtn = createBtn("Add salary", "bg-emerald-600", "hover:bg-emerald-700");
        salaryBtn.addEventListener("click", () => {
            this.dispatchEvent(OpenAddSalaryModalEvent(user));
        });
        const payrollBtn = createBtn("Generate payroll", "bg-purple-600", "hover:bg-purple-700");
        payrollBtn.addEventListener("click", () => {
            this.dispatchEvent(OpenGeneratePayrollModalEvent(user));
        });

        const viewBtn = createBtn("View", "bg-indigo-600", "hover:bg-indigo-700");
        viewBtn.addEventListener("click", () => {
            this.dispatchEvent(OpenViewUserModalEvent(user));
        });

        const deleteBtn = createBtn("Delete", "bg-rose-600", "hover:bg-rose-700");
        deleteBtn.addEventListener("click", async () => {
            if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
                const res = await userHandler.DeleteUser(user.id);
                if (res.ok) {
                    alert("User deleted successfully");
                    window.location.reload();
                } else {
                    alert("Failed to delete user: " + res.data);
                }
            }
        });

        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(salaryBtn);
        actionDiv.appendChild(payrollBtn);
        actionDiv.appendChild(viewBtn);
        actionDiv.appendChild(deleteBtn);

        actionsTd.appendChild(actionDiv);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
    });
}

const ShowAllUsersTemplate = document.createElement("template");
ShowAllUsersTemplate.innerHTML = `
<div class="w-full max-w-7xl mx-auto mt-8 mb-8">
    <div class="bg-white rounded-2xl overflow-hidden border border-slate-200">
        <div class="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
            <h5 class="text-xl font-bold text-slate-800">All Employees</h5>
            
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50/50">
                    <tr>
                        <th scope="col"  class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Photo</th>
                        <th scope="col"  id="th-name" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Name 
                            <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-email" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Email ID
                             <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-department" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none group">
                            Department
                             <span class="inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity">⇅</span>
                        </th>
                        <th scope="col" id="th-skills" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">All Skills</th>
                        <th scope="col" id="th-note" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
                        <th scope="col" id="th-online" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Online</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-100" id="users-table-body">
                    <!-- Rows will be populated here -->
                </tbody>
            </table>
        </div>
    </div>
    <app-add-salary-modal></app-add-salary-modal>
    <app-generate-payroll-modal></app-generate-payroll-modal>
    <app-view-user-modal></app-view-user-modal>
</div>`;

class ShowAllUsers extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        this.innerHTML = '';
        this.appendChild(ShowAllUsersTemplate.content.cloneNode(true));
        this.users = [];
        this.sortState = { key: null, direction: 'asc' };

        const tbody = this.querySelector("#users-table-body");

        const thName = this.querySelector("#th-name");
        const thEmail = this.querySelector("#th-email");
        const thDepartment = this.querySelector("#th-department");
        const thSkills = this.querySelector("#th-skills");
        const thNote = this.querySelector("#th-note");
        const thOnline = this.querySelector("#th-online");



        const handleSort = (key) => {
            if (!this.users || this.users.length === 0) return;

            if (this.sortState.key === key) {
                this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortState.key = key;
                this.sortState.direction = 'asc';
            }

            this.users = SortUsers(this.users, this.sortState.key, this.sortState.direction);
            tbody.innerHTML = '';
            RenderUsers(this.users, tbody);

            // Update visual indicators
            [thName, thEmail, thDepartment].forEach(th => {
                const span = th.querySelector('span');
                if (span) span.textContent = '⇅';
                if (span) span.className = "inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity";
                th.classList.remove('bg-slate-100');
            });

            const activeTh = key === 'name' ? thName : key === 'email' ? thEmail : thDepartment;
            if (activeTh) {
                // activeTh.classList.add('bg-slate-100'); // Optional background highlight
                const span = activeTh.querySelector('span');
                if (span) {
                    span.textContent = this.sortState.direction === 'asc' ? '↑' : '↓';
                    span.className = "inline-block ml-1 opacity-100 text-slate-800";
                }
            }
        };

        thName.addEventListener("click", () => handleSort("name"));
        thEmail.addEventListener("click", () => handleSort("email"));
        thDepartment.addEventListener("click", () => handleSort("department"));

        try {
            const response = await userHandler.GetAllUser();

            // Handle nested response structure from UserHandler -> UserRepo
            if (response.ok) {
                if (response.data && response.data.ok && Array.isArray(response.data.data)) {
                    this.users = response.data.data;
                } else if (response.data && Array.isArray(response.data.data)) {
                    this.users = response.data.data;
                } else if (Array.isArray(response.data)) {
                    this.users = response.data;
                }
            } else {
                console.error("Failed to fetch users", response);
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-8">Failed to load users: ${response.data}</td></tr>`;
                return;
            }

            if (!this.users || this.users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-slate-500 py-8">No users found</td></tr>`;
                return;
            }
            this.addEventListener("refresh-users", async (event) => {
                console.log("refresh-users event received:", event);
                const newUser = {
                    email: event.detail.email,
                    firstName: event.detail.firstName,
                    lastName: event.detail.lastName,
                    department: event.detail.department,
                    skills: event.detail.skills,
                    profilePhoto: event.detail.profilePhoto,
                    note: event.detail.note,
                };
                this.users.push(newUser);
                // Re-sort if sort is active
                if (this.sortState.key) {
                    this.users = SortUsers(this.users, this.sortState.key, this.sortState.direction);
                }
                tbody.innerHTML = '';
                RenderUsers.call(this, this.users, tbody);
            });
            RenderUsers.call(this, this.users, tbody);



        } catch (error) {
            console.error("Error fetching users:", error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose-500 py-8">Error loading users</td></tr>`;
        }
    }
}

customElements.define("app-show-all-users", ShowAllUsers);
