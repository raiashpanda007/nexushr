const AttendanceViewTemplate = document.createElement("template");
AttendanceViewTemplate.innerHTML = `
    <div class="w-full max-w-7xl mx-auto p-6">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Attendance</h2>
                <p class="text-slate-500">Track your attendance and work hours</p>
            </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900">Attendance Module</h3>
            <p class="text-slate-500 mt-1">Coming soon.</p>
        </div>
    </div>
`;

class AttendanceView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(AttendanceViewTemplate.content.cloneNode(true));
    }
}

customElements.define("app-attendance-view", AttendanceView);
