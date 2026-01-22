import { AddLeaveTypeCustomEvent, OpenEditLeaveTypeModalEvent } from "../../events.js";
import { leaveTypeHandler, authState, leaveApplicationHandler, userHandler } from "../../Core/startup.js";
import "../Cards/Modals/AddLeaveTypeForm.js";
import "../Cards/Modals/EditLeaveTypeModal.js";

const LeavesViewTemplate = document.createElement("template");
LeavesViewTemplate.innerHTML = `
    <div class="w-full max-w-7xl mx-auto p-6">
        <!-- HR View: Leave Types Section -->
        <div id="hr-leavetypes-section" class="hidden mb-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Leave Types</h2>
                    <p class="text-slate-500">Manage leave policies and types</p>
                </div>
                <button id="add-leavetype-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Leave Type
                </button>
            </div>
            
            <div id="leavetypes-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <!-- Leave Types will be injected here -->
            </div>

            <div id="no-leavetypes" class="hidden bg-white rounded-xl border border-slate-200 p-8 text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-900">No leave types found</h3>
                <p class="text-slate-500 mt-1">Configure leave types for your organization.</p>
            </div>
        </div>

        <!-- HR View: Leave Applications Section -->
        <div id="hr-leaveapplications-section" class="hidden">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Leave Applications</h2>
                    <p class="text-slate-500">Review and manage employee leave requests</p>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex gap-4">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
                    <select id="status-filter" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-medium text-slate-700 mb-2">Filter by User</label>
                    <select id="user-filter" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Users</option>
                    </select>
                </div>
            </div>

            <!-- Leave Applications Table -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Leave Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applied At</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="hr-leaveapplications-table-body" class="bg-white divide-y divide-slate-200">
                            <!-- Leave applications will be injected here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="hr-no-leaveapplications" class="hidden bg-white rounded-xl border border-slate-200 p-8 text-center mt-6">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-900">No leave applications found</h3>
                <p class="text-slate-500 mt-1">No leave applications match your filters.</p>
            </div>
        </div>

        <!-- EMP View: Leave Applications Section -->
        <div id="emp-leaveapplications-section" class="hidden">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">My Leave Applications</h2>
                    <p class="text-slate-500">View and manage your leave requests</p>
                </div>
                <button id="apply-leave-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Apply for Leave
                </button>
            </div>

            <!-- Apply Leave Form -->
            <div id="apply-leave-form" class="hidden bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Apply for Leave</h3>
                <form id="leave-application-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                            <select id="leave-type-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Leave Type</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                            <input type="date" id="start-date" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                            <input type="date" id="end-date" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                        <textarea id="leave-reason" required rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter reason for leave..."></textarea>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Submit Application
                        </button>
                        <button type="button" id="cancel-apply-btn" class="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            <!-- Leave Applications List -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Leave Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applied At</th>
                            </tr>
                        </thead>
                        <tbody id="emp-leaveapplications-table-body" class="bg-white divide-y divide-slate-200">
                            <!-- Leave applications will be injected here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="emp-no-leaveapplications" class="hidden bg-white rounded-xl border border-slate-200 p-8 text-center mt-6">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-900">No leave applications</h3>
                <p class="text-slate-500 mt-1">You haven't applied for any leaves yet.</p>
            </div>
        </div>

        <app-add-leave-type-modal></app-add-leave-type-modal>
        <app-edit-leave-type-modal></app-edit-leave-type-modal>
    </div>
`;

class LeavesView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(LeavesViewTemplate.content.cloneNode(true));
        this.allUsers = [];
        this.allLeaveApplications = [];
        this.filteredLeaveApplications = [];
    }

    async connectedCallback() {
        const { ok, data } = authState.GetCurrUserState();
        const isHR = ok && data && data.user && data.user.role === "HR";
        const currentUserId = ok && data && data.user ? data.user.id : null;

        if (isHR) {
            // Show HR sections
            this.querySelector("#hr-leavetypes-section").classList.remove("hidden");
            this.querySelector("#hr-leaveapplications-section").classList.remove("hidden");
            this.querySelector("#emp-leaveapplications-section").classList.add("hidden");

            // Setup leave types
            this.querySelector("#add-leavetype-btn").addEventListener("click", () => {
                this.dispatchEvent(AddLeaveTypeCustomEvent());
            });

            await this.renderLeaveTypes();

            // Setup leave applications
            await this.loadAllUsers();
            await this.renderHRLeaveApplications();

            // Setup filters
            this.querySelector("#status-filter").addEventListener("change", () => this.applyFilters());
            this.querySelector("#user-filter").addEventListener("change", () => this.applyFilters());

            // Listen for updates
            document.addEventListener("create-leave-type-success", () => this.renderLeaveTypes());
            document.addEventListener("edit-leave-type-success", () => this.renderLeaveTypes());
        } else {
            // Show EMP sections
            this.querySelector("#hr-leavetypes-section").classList.add("hidden");
            this.querySelector("#hr-leaveapplications-section").classList.add("hidden");
            this.querySelector("#emp-leaveapplications-section").classList.remove("hidden");

            // Setup apply leave form
            await this.loadLeaveTypesForForm();
            this.querySelector("#apply-leave-btn").addEventListener("click", () => {
                this.querySelector("#apply-leave-form").classList.remove("hidden");
            });
            this.querySelector("#cancel-apply-btn").addEventListener("click", () => {
                this.querySelector("#apply-leave-form").classList.add("hidden");
                this.querySelector("#leave-application-form").reset();
            });
            this.querySelector("#leave-application-form").addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.submitLeaveApplication(currentUserId);
            });

            await this.renderEMPLeaveApplications(currentUserId);
        }
    }

    async renderLeaveTypes() {
        const listContainer = this.querySelector("#leavetypes-list");
        const noDataContainer = this.querySelector("#no-leavetypes");

        listContainer.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">Loading...</div>';

        const { ok, data } = await leaveTypeHandler.GetAllLeaveTypes();
        listContainer.innerHTML = '';

        if (!ok || !data || data.length === 0) {
            listContainer.classList.add("hidden");
            noDataContainer.classList.remove("hidden");
            return;
        }

        listContainer.classList.remove("hidden");
        noDataContainer.classList.add("hidden");

        data.forEach(leaveType => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-xl border border-slate-200 p-6 transition-colors group relative";

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-emerald-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-btn p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button class="delete-btn p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">${leaveType.name}</h3>
                <div class="flex items-center gap-2 mt-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Code: ${leaveType.code}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leaveType.length === 'full' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                        ${leaveType.length === 'full' ? 'Full Day' : 'Half Day'}
                    </span>
                </div>
            `;

            card.querySelector(".edit-btn").addEventListener("click", () => {
                this.dispatchEvent(OpenEditLeaveTypeModalEvent(leaveType));
            });

            card.querySelector(".delete-btn").addEventListener("click", async () => {
                if (confirm(`Are you sure you want to delete ${leaveType.name}?`)) {
                    const res = await leaveTypeHandler.DeleteLeaveType(leaveType.id);
                    if (res.ok) {
                        this.renderLeaveTypes();
                    } else {
                        alert("Failed to delete leave type: " + res.data);
                    }
                }
            });

            listContainer.appendChild(card);
        });
    }

    async loadAllUsers() {
        const { ok, data } = await userHandler.GetAllUser();
        if (ok && data) {
            this.allUsers = Array.isArray(data) ? data : (data.data || []);
            const userFilter = this.querySelector("#user-filter");
            this.allUsers.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = `${user.firstName} ${user.lastName}`;
                userFilter.appendChild(option);
            });
        }
    }

    async renderHRLeaveApplications() {
        const tbody = this.querySelector("#hr-leaveapplications-table-body");
        const noDataContainer = this.querySelector("#hr-no-leaveapplications");

        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-500 py-8">Loading...</td></tr>';

        const { ok, data } = await leaveApplicationHandler.fetchAllLeaveApplications();
        
        if (!ok || !data || data.length === 0) {
            tbody.innerHTML = '';
            tbody.parentElement.parentElement.classList.add("hidden");
            noDataContainer.classList.remove("hidden");
            return;
        }

        this.allLeaveApplications = data;
        this.applyFilters();
    }

    applyFilters() {
        const statusFilter = this.querySelector("#status-filter").value;
        const userFilter = this.querySelector("#user-filter").value;

        this.filteredLeaveApplications = this.allLeaveApplications.filter(app => {
            const statusMatch = !statusFilter || app.status === statusFilter;
            const userMatch = !userFilter || app.userId === userFilter;
            return statusMatch && userMatch;
        });

        this.renderFilteredHRLeaveApplications();
    }

    renderFilteredHRLeaveApplications() {
        const tbody = this.querySelector("#hr-leaveapplications-table-body");
        const noDataContainer = this.querySelector("#hr-no-leaveapplications");

        tbody.innerHTML = '';

        if (this.filteredLeaveApplications.length === 0) {
            tbody.parentElement.parentElement.classList.add("hidden");
            noDataContainer.classList.remove("hidden");
            return;
        }

        tbody.parentElement.parentElement.classList.remove("hidden");
        noDataContainer.classList.add("hidden");

        this.filteredLeaveApplications.forEach(app => {
            const user = this.allUsers.find(u => u.id === app.userId);
            const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
            
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50 transition-colors";

            const statusBadge = this.getStatusBadge(app.status);

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${userName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${app.leaveType}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(app.startDate).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(app.endDate).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title="${app.reason}">${app.reason}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(app.appliedAt).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${app.status === 'Pending' ? `
                        <div class="flex gap-2">
                            <button class="accept-btn px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" data-id="${app.id}">
                                Accept
                            </button>
                            <button class="reject-btn px-3 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors" data-id="${app.id}">
                                Reject
                            </button>
                        </div>
                    ` : '-'}
                </td>
            `;

            if (app.status === 'Pending') {
                tr.querySelector(".accept-btn").addEventListener("click", async () => {
                    await this.handleAcceptLeave(app.id);
                });
                tr.querySelector(".reject-btn").addEventListener("click", async () => {
                    await this.handleRejectLeave(app.id);
                });
            }

            tbody.appendChild(tr);
        });
    }

    async handleAcceptLeave(leaveAppId) {
        const { ok, data } = await leaveApplicationHandler.AccpetLeaveApplication(leaveAppId);
        if (ok) {
            await this.renderHRLeaveApplications();
        } else {
            alert("Failed to accept leave: " + data);
        }
    }

    async handleRejectLeave(leaveAppId) {
        const { ok, data } = await leaveApplicationHandler.RejectLeaveApplication(leaveAppId);
        if (ok) {
            await this.renderHRLeaveApplications();
        } else {
            alert("Failed to reject leave: " + data);
        }
    }

    async loadLeaveTypesForForm() {
        const select = this.querySelector("#leave-type-select");
        const { ok, data } = await leaveTypeHandler.GetAllLeaveTypes();
        if (ok && data) {
            select.innerHTML = '<option value="">Select Leave Type</option>';
            data.forEach(leaveType => {
                const option = document.createElement("option");
                option.value = leaveType.name;
                option.textContent = `${leaveType.name} (${leaveType.code})`;
                select.appendChild(option);
            });
        }
    }

    async submitLeaveApplication(userId) {
        const leaveType = this.querySelector("#leave-type-select").value;
        const startDate = this.querySelector("#start-date").value;
        const endDate = this.querySelector("#end-date").value;
        const reason = this.querySelector("#leave-reason").value;

        if (!leaveType || !startDate || !endDate || !reason) {
            alert("Please fill all fields");
            return;
        }

        const { ok, data } = await leaveApplicationHandler.applyLeave(leaveType, startDate, endDate, reason, userId);
        
        if (ok) {
            alert("Leave application submitted successfully!");
            this.querySelector("#apply-leave-form").classList.add("hidden");
            this.querySelector("#leave-application-form").reset();
            
            const { ok: userOk, data: userData } = authState.GetCurrUserState();
            if (userOk && userData && userData.user) {
                await this.renderEMPLeaveApplications(userData.user.id);
            }
        } else {
            alert("Failed to submit leave application: " + data);
        }
    }

    async renderEMPLeaveApplications(userId) {
        const tbody = this.querySelector("#emp-leaveapplications-table-body");
        const noDataContainer = this.querySelector("#emp-no-leaveapplications");

        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-500 py-8">Loading...</td></tr>';

        const { ok, data } = await leaveApplicationHandler.GetOwnLeave();
        
        if (!ok || !data || data.length === 0) {
            tbody.innerHTML = '';
            tbody.parentElement.parentElement.classList.add("hidden");
            noDataContainer.classList.remove("hidden");
            return;
        }

        tbody.parentElement.parentElement.classList.remove("hidden");
        noDataContainer.classList.add("hidden");
        tbody.innerHTML = '';

        // Sort by appliedAt descending (newest first)
        const sortedData = [...data].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        sortedData.forEach(app => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50 transition-colors";

            const statusBadge = this.getStatusBadge(app.status);

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${app.leaveType}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(app.startDate).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(app.endDate).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title="${app.reason}">${app.reason}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(app.appliedAt).toLocaleDateString()}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    getStatusBadge(status) {
        const badges = {
            'Pending': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>',
            'Accepted': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Accepted</span>',
            'Rejected': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Rejected</span>'
        };
        return badges[status] || `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">${status}</span>`;
    }
}

customElements.define("app-leaves-view", LeavesView);
