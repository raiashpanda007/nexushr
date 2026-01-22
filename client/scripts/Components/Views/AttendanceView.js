import { attendanceHandler, socketHandler } from "../../Core/startup.js";


const AttendanceViewTemplate = document.createElement("template");
AttendanceViewTemplate.innerHTML = `
    <div class="w-full max-w-7xl mx-auto p-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Attendance</h2>
                <p class="text-slate-500">Track your daily attendance</p>
            </div>
            <div class="flex gap-3">
                <button id="check-in-btn" class="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Enter
                </button>
                <button id="check-out-btn" class="bg-rose-600 text-white px-6 py-2.5 rounded-lg hover:bg-rose-700 transition-colors flex items-center shadow-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Exit
                </button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                <label for="attendance-date" class="text-sm font-medium text-slate-700">Filter by Date:</label>
                <input type="date" id="attendance-date" class="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <button id="reset-filter-btn" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Reset to Today</button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                            <th class="px-6 py-4 font-semibold border-b border-slate-200">Date</th>
                            <th class="px-6 py-4 font-semibold border-b border-slate-200">Time</th>
                            <th class="px-6 py-4 font-semibold border-b border-slate-200">Type</th>
                            <th class="px-6 py-4 font-semibold border-b border-slate-200">Status</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-list" class="divide-y divide-slate-100">
                        <!-- Rows will be injected here -->
                    </tbody>
                </table>
            </div>
            
            <div id="no-records" class="hidden p-8 text-center text-slate-500">
                No attendance records found for this date.
            </div>
        </div>
    </div>
`;

class AttendanceView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(AttendanceViewTemplate.content.cloneNode(true));
    }

    async connectedCallback() {
        const dateInput = this.querySelector("#attendance-date");
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;

        this.querySelector("#check-in-btn").addEventListener("click", async () => {
            await this.markAttendance("ENTRY");
            socketHandler.CheckIn();
        });

        this.querySelector("#check-out-btn").addEventListener("click", async () => {
            await this.markAttendance("EXIT");
            socketHandler.CheckOut()
        });

        dateInput.addEventListener("change", () => {
            this.renderAttendance(new Date(dateInput.value));
        });

        this.querySelector("#reset-filter-btn").addEventListener("click", () => {
            dateInput.value = today;
            this.renderAttendance(new Date(today));
        });

        await this.renderAttendance(new Date(today));
    }

    async markAttendance(type) {
        const { ok, data } = await attendanceHandler.Create(attendanceHandler.user.data.user.id, type);
        if (ok) {
            // Refresh list
            const dateInput = this.querySelector("#attendance-date");
            this.renderAttendance(new Date(dateInput.value));
            alert(`Successfully marked ${type === 'ENTRY' ? 'Enter' : 'Exit'}`);
        } else {
            alert("Failed to mark attendance: " + data);
        }
    }

    async renderAttendance(date) {
        const listContainer = this.querySelector("#attendance-list");
        const noRecords = this.querySelector("#no-records");

        listContainer.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">Loading...</td></tr>';

        const { ok, data } = await attendanceHandler.GetAttendance();

        listContainer.innerHTML = '';

        const targetDate = date.toISOString().split('T')[0];
        const filteredData = data.filter(record => {
            const recordDate = new Date(record.entryDate || record.exitDate || record.createdAt);
            return recordDate.toISOString().split('T')[0] === targetDate;
        });

        if (filteredData.length === 0) {
            noRecords.classList.remove("hidden");
            return;
        }

        noRecords.classList.add("hidden");

        filteredData.sort((a, b) => {
            const dateA = new Date(a.entryDate || a.exitDate || a.createdAt);
            const dateB = new Date(b.entryDate || b.exitDate || b.createdAt);
            return dateB - dateA;
        });

        filteredData.forEach(record => {
            const recordDate = new Date(record.entryDate || record.exitDate || record.createdAt);
            const type = record.type.toUpperCase();
            const isEntry = type === 'ENTRY' || type === 'ENTER';

            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 transition-colors";
            row.innerHTML = `
                <td class="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                    ${recordDate.toLocaleDateString()}
                </td>
                <td class="px-6 py-4 text-slate-600 whitespace-nowrap font-mono">
                    ${recordDate.toLocaleTimeString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isEntry ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${isEntry ? 'Enter' : 'Exit'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center text-slate-500 text-sm">
                        <svg class="w-4 h-4 mr-1.5 ${isEntry ? 'text-emerald-500' : 'text-rose-500'}" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        Recorded
                    </span>
                </td>
            `;
            listContainer.appendChild(row);
        });
    }
}

customElements.define("app-attendance-view", AttendanceView);
