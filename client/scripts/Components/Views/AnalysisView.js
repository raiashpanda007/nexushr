import { analysisHandler } from "../../Core/startup.js";
import { LeaveCharts } from "../Charts/LeaveCharts.js";
import { AttendanceCharts } from "../Charts/AttendanceCharts.js";
import { SalaryCharts } from "../Charts/SalaryCharts.js";

const AnalysisViewTemplate = document.createElement("template");
AnalysisViewTemplate.innerHTML = `
    <div class="w-full max-w-7xl mx-auto p-6">
       <h2 id="main-title" class="text-2xl font-bold text-slate-800 mb-8">Analyze</h2>

       <div id="analysis-breadcrumb-container" class="hidden mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <nav class="flex items-center" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                    <li class="inline-flex items-center">
                        <a href="#" id="back-to-main" class="inline-flex items-center text-sm font-medium text-slate-700 hover:text-blue-600">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                            Analyze
                        </a>
                    </li>
                    <li>
                        <div class="flex items-center">
                            <svg class="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
                            <span id="current-view-title" class="ml-1 text-sm font-medium text-slate-500 md:ml-2"></span>
                        </div>
                    </li>
                </ol>
            </nav>

            <div class="flex items-center space-x-2">
                <div id="dept-filter-container" class="relative hidden">
                    <select id="analysis-dept-filter" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 p-2.5 min-w-[150px]">
                        <option value="">All Departments</option>
                    </select>
                </div>

                <!-- Skill Filter -->
                <div id="skill-filter-container" class="relative hidden">
                    <select id="analysis-skill-filter" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 p-2.5 min-w-[150px]">
                         <option value="">All Skills</option>
                    </select>
                </div>

                <!-- Employee Filter (Custom Searchable Dropdown) -->
                <div id="employee-filter-container" class="relative hidden">
                    <button id="emp-dropdown-btn" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full pl-3 p-2.5 min-w-[200px] flex justify-between items-center">
                        <span id="emp-selected-name" class="truncate">All Employees</span>
                        <svg class="w-4 h-4 ml-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <!-- Dropdown Body -->
                    <div id="emp-dropdown-body" class="hidden absolute z-50 w-[250px] bg-white shadow-xl rounded-lg border border-slate-200 mt-1 overflow-hidden">
                        <div class="p-2 border-b border-slate-100 bg-slate-50">
                            <input type="text" id="emp-search" placeholder="Search..." class="w-full text-xs border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-none">
                        </div>
                        <div id="emp-list" class="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                           <!-- Items -->
                        </div>
                    </div>
                </div>
                <div class="relative">
                    <input type="date" id="start-date" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 p-2.5">
                </div>
                <span class="text-slate-500 text-sm">to</span>
                <div class="relative">
                    <input type="date" id="end-date" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 p-2.5">
                </div>
                <button id="apply-filters" class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 transition-colors">
                    Apply
                </button>
            </div>
       </div>
       
       <div id="main-analysis-options" class="grid grid-cols-1 md:grid-cols-3 gap-6">
           <!-- Leaves -->
           <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-500" id="analyze-leaves-btn">
               <div class="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                   </svg>
               </div>
               <h3 class="text-xl font-semibold text-slate-800 mb-2">Leaves</h3>
               <p class="text-slate-500 text-sm">Analyze leave patterns, balances, and trends.</p>
           </div>

           <!-- Attendance -->
           <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-500" id="analyze-attendance-btn">
               <div class="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                   </svg>
               </div>
               <h3 class="text-xl font-semibold text-slate-800 mb-2">Attendance</h3>
               <p class="text-slate-500 text-sm">Track daily attendance, overtime, and punctuality.</p>
           </div>

           <!-- Salary -->
           <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-purple-500" id="analyze-salaries-btn">
               <div class="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                   </svg>
               </div>
               <h3 class="text-xl font-semibold text-slate-800 mb-2">Salary</h3>
               <p class="text-slate-500 text-sm">View salary breakdowns, deductions, and history.</p>
           </div>
       </div>

       <!-- Leaves Analysis Sub-Options (Hidden by default) -->
       <div id="leaves-analysis-options" class="hidden animate-fade-in-up">
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 cursor-pointer" id="analyze-leaves-dept">
                   <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">By Department</h3>
                   <p class="text-xs text-slate-500">Breakdown of leaves across different departments.</p>
               </div>
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 cursor-pointer" id="analyze-leaves-emp">
                   <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">By Employees</h3>
                   <p class="text-xs text-slate-500">Individual leave history and balance report.</p>
               </div>
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 cursor-pointer" id="analyze-leaves-skill">
                   <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">By Skill Types</h3>
                   <p class="text-xs text-slate-500">Leave distribution based on employee skills.</p>
               </div>
           </div>
       </div>

       <!-- Attendance Analysis Sub-Options (Hidden by default) -->
       <div id="attendance-analysis-options" class="hidden animate-fade-in-up">
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer" id="analyze-attendance-dept">
                   <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">By Department</h3>
                   <p class="text-xs text-slate-500">Attendance trends by departments.</p>
               </div>
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer" id="analyze-attendance-emp">
                   <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">By Employees</h3>
                   <p class="text-xs text-slate-500">Individual attendance logs.</p>
               </div>
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer" id="analyze-attendance-skill">
                   <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">By Skill Types</h3>
                   <p class="text-xs text-slate-500">Attendance based on skill.</p>
               </div>
           </div>
       </div>

       <!-- Salaries Analysis Sub-Options (Hidden by default) -->
       <div id="salaries-analysis-options" class="hidden animate-fade-in-up">
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-pointer" id="analyze-salaries-dept">
                   <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">By Department</h3>
                   <p class="text-xs text-slate-500">Cost distribution by department.</p>
               </div>
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-pointer" id="analyze-salaries-emp">
                   <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">By Employees</h3>
                   <p class="text-xs text-slate-500">Individual salary details.</p>
               </div>
               <div class="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-pointer" id="analyze-salaries-skill">
                   <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <h3 class="text-md font-semibold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">By Skill Types</h3>
                   <p class="text-xs text-slate-500">Salaries based on skills.</p>
               </div>
           </div>
       </div>

       <div id="analysis-content" class="mt-6"></div>
    </div>
`;

class AnalysisView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(AnalysisViewTemplate.content.cloneNode(true));
        this.activeCategory = null;
        this.lastSelectedType = null;
    }

    connectedCallback() {
        this._loadDepartments();
        this._loadSkills();
        this._loadEmployees();

        const empBtn = this.querySelector("#emp-dropdown-btn");
        const empBody = this.querySelector("#emp-dropdown-body");
        const empSearch = this.querySelector("#emp-search");

        if (empBtn && empBody) {
            empBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                empBody.classList.toggle("hidden");
            });

            document.addEventListener("click", (e) => {
                if (!this.contains(e.target)) {
                    empBody.classList.add("hidden");
                }
            });
        }

        // Employee Search Logic
        if (empSearch) {
            empSearch.addEventListener("input", (e) => {
                const term = e.target.value.toLowerCase();
                const items = this.querySelectorAll(".emp-item");
                items.forEach(item => {
                    const name = item.dataset.name.toLowerCase();
                    if (name.includes(term)) {
                        item.classList.remove("hidden");
                    } else {
                        item.classList.add("hidden");
                    }
                });
            });
        }

        // Main Options
        this.querySelector("#analyze-leaves-btn").addEventListener("click", () => this.showLeavesOptions());
        this.querySelector("#analyze-attendance-btn").addEventListener("click", () => this.showAttendanceOptions());
        this.querySelector("#analyze-salaries-btn").addEventListener("click", () => this.showSalariesOptions());

        // Back Button
        this.querySelector("#back-to-main").addEventListener("click", () => this.showMainOptions());

        // Leaves Sub Options
        this.querySelector("#analyze-leaves-dept").addEventListener("click", () => this.selectSubOption("department"));
        this.querySelector("#analyze-leaves-emp").addEventListener("click", () => this.selectSubOption("employee"));
        this.querySelector("#analyze-leaves-skill").addEventListener("click", () => this.selectSubOption("skill"));

        // Attendance Sub Options
        this.querySelector("#analyze-attendance-dept").addEventListener("click", () => this.selectSubOption("department"));
        this.querySelector("#analyze-attendance-emp").addEventListener("click", () => this.selectSubOption("employee"));
        this.querySelector("#analyze-attendance-skill").addEventListener("click", () => this.selectSubOption("skill"));

        // Salaries Sub Options
        this.querySelector("#analyze-salaries-dept").addEventListener("click", () => this.selectSubOption("department"));
        this.querySelector("#analyze-salaries-emp").addEventListener("click", () => this.selectSubOption("employee"));
        this.querySelector("#analyze-salaries-skill").addEventListener("click", () => this.selectSubOption("skill"));

        // Filter Apply
        this.querySelector("#apply-filters").addEventListener("click", () => {
            if (this.lastSelectedType) {
                this.selectSubOption(this.lastSelectedType);
            }
        });
    }

    async _loadDepartments() {
        if (analysisHandler.departmentHandler) {
            const result = await analysisHandler.departmentHandler.GetAllDepartments();
            if (result.ok) {
                const select = this.querySelector("#analysis-dept-filter");
                result.data.forEach(dept => {
                    const option = document.createElement("option");
                    option.value = dept.name; // Filter by name as requested by logic in handler
                    option.textContent = dept.name;
                    select.appendChild(option);
                });
                console.log("debug ::::: Departments loaded for filter. :: ", result);
            }
        }
    }



    async _loadSkills() {
        if (analysisHandler.skillHandler) {
            const result = await analysisHandler.skillHandler.GetAllSkills();
            if (result.ok) {
                const select = this.querySelector("#analysis-skill-filter");
                result.data.forEach(skill => {
                    const option = document.createElement("option");
                    option.value = skill.id;
                    option.textContent = skill.name;
                    select.appendChild(option);
                });
            }
        }
    }

    async _loadEmployees() {
        if (analysisHandler.userHandler) {
            const result = await analysisHandler.userHandler.GetAllUser();
            if (result.ok) {
                const users = Array.isArray(result.data) ? result.data : (result.data.data || []);
                const list = this.querySelector("#emp-list");

                // Add "All Employees" option
                const allOption = document.createElement("div");
                allOption.className = "emp-item p-2 hover:bg-blue-50 cursor-pointer text-sm rounded text-slate-700";
                allOption.textContent = "All Employees";
                allOption.dataset.name = "All Employees";
                allOption.addEventListener("click", () => {
                    this.selectedEmployeeId = null;
                    this.querySelector("#emp-selected-name").textContent = "All Employees";
                    this.querySelector("#emp-dropdown-body").classList.add("hidden");
                });
                list.appendChild(allOption);

                users.forEach(user => {
                    const div = document.createElement("div");
                    div.className = "emp-item p-2 hover:bg-blue-50 cursor-pointer text-sm rounded text-slate-700 flex flex-col border-b border-slate-100 last:border-0";
                    const name = `${user.firstName} ${user.lastName}`;
                    div.innerHTML = `<span class="font-medium">${name}</span><span class="text-xs text-slate-400">${user.role || 'Employee'}</span>`;
                    div.dataset.name = name;

                    div.addEventListener("click", () => {
                        this.selectedEmployeeId = user.id;
                        this.querySelector("#emp-selected-name").textContent = name;
                        this.querySelector("#emp-dropdown-body").classList.add("hidden");
                    });

                    list.appendChild(div);
                });
            }
        }
    }

    showMainOptions() {
        const mainOptions = this.querySelector("#main-analysis-options");
        const leavesOptions = this.querySelector("#leaves-analysis-options");
        const attendanceOptions = this.querySelector("#attendance-analysis-options");
        const salariesOptions = this.querySelector("#salaries-analysis-options");
        const breadcrumb = this.querySelector("#analysis-breadcrumb-container");
        const mainTitle = this.querySelector("#main-title");
        const contentDiv = this.querySelector("#analysis-content");

        mainOptions.classList.remove("hidden");
        leavesOptions.classList.add("hidden");
        attendanceOptions.classList.add("hidden");
        salariesOptions.classList.add("hidden");

        breadcrumb.classList.add("hidden");
        mainTitle.textContent = "Analyze";
        contentDiv.innerHTML = "";
        this.activeCategory = null;
        this.lastSelectedType = null;
    }

    _showSubOptions(categoryId, title) {
        const mainOptions = this.querySelector("#main-analysis-options");
        const targetOptions = this.querySelector(`#${categoryId}`);
        const breadcrumb = this.querySelector("#analysis-breadcrumb-container");
        const currentViewTitle = this.querySelector("#current-view-title");
        const mainTitle = this.querySelector("#main-title");



        // Reset filter visibility
        this.querySelector("#dept-filter-container").classList.add("hidden");
        this.querySelector("#skill-filter-container").classList.add("hidden");
        this.querySelector("#employee-filter-container").classList.add("hidden");

        // Hide all sub-options first to be safe
        this.querySelector("#leaves-analysis-options").classList.add("hidden");
        this.querySelector("#attendance-analysis-options").classList.add("hidden");
        this.querySelector("#salaries-analysis-options").classList.add("hidden");

        mainOptions.classList.add("hidden");
        targetOptions.classList.remove("hidden");

        breadcrumb.classList.remove("hidden");
        currentViewTitle.textContent = title;
        mainTitle.textContent = title;

        // Clear previous content
        this.querySelector("#analysis-content").innerHTML = "";
    }

    showLeavesOptions() {
        this.activeCategory = 'Leaves';
        this._showSubOptions('leaves-analysis-options', 'Leaves Analysis');
    }

    showAttendanceOptions() {
        this.activeCategory = 'Attendance';
        this._showSubOptions('attendance-analysis-options', 'Attendance Analysis');
    }

    showSalariesOptions() {
        this.activeCategory = 'Salaries';
        this._showSubOptions('salaries-analysis-options', 'Salaries Analysis');
    }

    async selectSubOption(type) {
        this.lastSelectedType = type;
        const title = `${this.activeCategory} By ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        console.log(`Selected sub-option: ${title} (${type})`);

        // Handle Filter Visibility
        const deptFilterContainer = this.querySelector("#dept-filter-container");
        const skillFilterContainer = this.querySelector("#skill-filter-container");
        const empFilterContainer = this.querySelector("#employee-filter-container");

        deptFilterContainer.classList.add("hidden");
        skillFilterContainer.classList.add("hidden");
        empFilterContainer.classList.add("hidden");

        if (type === 'department') {
            deptFilterContainer.classList.remove("hidden");
        } else if (type === 'skill') {
            skillFilterContainer.classList.remove("hidden");
        } else if (type === 'employee') {
            empFilterContainer.classList.remove("hidden");
        }

        const contentDiv = this.querySelector("#analysis-content");
        contentDiv.innerHTML = `<p class="text-slate-600">Loading ${title}...</p>`;

        const startInput = this.querySelector("#start-date").value;
        const endInput = this.querySelector("#end-date").value;
        const deptInput = this.querySelector("#analysis-dept-filter").value;
        const skillInput = this.querySelector("#analysis-skill-filter").value;

        // Pass undefined if empty so backend knows to show all data
        const startDate = startInput ? startInput : undefined;
        const endDate = endInput ? endInput : undefined;

        let filterTarget = undefined;
        if (type === 'department') filterTarget = deptInput || undefined;
        if (type === 'skill') filterTarget = skillInput || undefined;
        if (type === 'employee') filterTarget = this.selectedEmployeeId || undefined;

        try {
            let result = { ok: false, data: "Unknown category" };

            if (this.activeCategory === 'Leaves') {
                result = await analysisHandler.LeaveAnalysis(type, startDate, endDate, filterTarget);
                console.log("debug :: result", result);
            } else if (this.activeCategory === 'Attendance') {
                result = await analysisHandler.AttendanceAnalysis(type, startDate, endDate, filterTarget);
            } else if (this.activeCategory === 'Salaries') {
                result = await analysisHandler.SalariesAnalysis(type, startDate, endDate, filterTarget);
            }

            let content = '';
            if (result && result.ok) {
                content = this._formatData(result.data, title);

                // Add Chart Container for Leaves By Department
                if (this.activeCategory === 'Leaves' && type === 'department') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in">
                             <canvas id="leaveDeptChart" style="max-height: 400px;"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Leaves By Employee
                if (this.activeCategory === 'Leaves' && type === 'employee') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="leaveEmpChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Leaves By Skill
                if (this.activeCategory === 'Leaves' && type === 'skill') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="leaveSkillChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Attendance By Department
                if (this.activeCategory === 'Attendance' && type === 'department') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="attendanceDeptChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Attendance By Employee
                if (this.activeCategory === 'Attendance' && type === 'employee') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="attendanceEmpChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Attendance By Skill
                if (this.activeCategory === 'Attendance' && type === 'skill') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="attendanceSkillChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Salaries By Department
                if (this.activeCategory === 'Salaries' && type === 'department') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="salaryDeptChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Salaries By Employee
                if (this.activeCategory === 'Salaries' && type === 'employee') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="salaryEmpChart"></canvas>
                        </div>
                    ` + content;
                }

                // Add Chart Container for Salaries By Skill
                if (this.activeCategory === 'Salaries' && type === 'skill') {
                    content = `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in relative h-[400px]">
                             <canvas id="salarySkillChart"></canvas>
                        </div>
                    ` + content;
                }

            } else {
                content = `
                    <div class="bg-red-50 p-6 rounded-xl border border-red-200">
                        <p class="text-red-600">Failed to load analysis: ${result?.data || "Unknown error"}</p>
                    </div>
                `;
            }
            contentDiv.innerHTML = content;

            // Render Charts
            if (result && result.ok && result.data.details) {
                // Leaves
                if (this.activeCategory === 'Leaves') {
                    if (type === 'department') {
                        setTimeout(() => LeaveCharts.renderDepartmentChart('leaveDeptChart', result.data.details), 100);
                    } else if (type === 'employee') {
                        setTimeout(() => LeaveCharts.renderEmployeeChart('leaveEmpChart', result.data.details), 100);
                    } else if (type === 'skill') {
                        setTimeout(() => LeaveCharts.renderSkillChart('leaveSkillChart', result.data.details), 100);
                    }
                }
                // Attendance
                else if (this.activeCategory === 'Attendance') {
                    if (type === 'department') {
                        setTimeout(() => AttendanceCharts.renderDepartmentChart('attendanceDeptChart', result.data.details), 100);
                    } else if (type === 'employee') {
                        setTimeout(() => AttendanceCharts.renderEmployeeChart('attendanceEmpChart', result.data.details), 100);
                    } else if (type === 'skill') {
                        setTimeout(() => AttendanceCharts.renderSkillChart('attendanceSkillChart', result.data.details), 100);
                    }
                }
                // Salaries
                else if (this.activeCategory === 'Salaries') {
                    if (type === 'department') {
                        setTimeout(() => SalaryCharts.renderDepartmentChart('salaryDeptChart', result.data.details), 100);
                    } else if (type === 'employee') {
                        setTimeout(() => SalaryCharts.renderEmployeeChart('salaryEmpChart', result.data.details), 100);
                    } else if (type === 'skill') {
                        setTimeout(() => SalaryCharts.renderSkillChart('salarySkillChart', result.data.details), 100);
                    }
                }
            }


        } catch (error) {
            console.error("Analysis Error:", error);
            contentDiv.innerHTML = `
                <div class="bg-red-50 p-6 rounded-xl border border-red-200">
                    <p class="text-red-600 font-bold">System Error</p>
                    <p class="text-red-600 text-sm mt-2">${error.message || String(error)}</p>
                    <pre class="bg-red-100 p-2 mt-2 rounded text-xs overflow-auto text-red-800">${error.stack || ''}</pre>
                </div>
            `;
        }
    }

    _formatData(data, title) {
        if (!data.summary && !data.highlights && !data.details) {
            return `
                <div class="bg-white p-6 rounded-xl border border-slate-200 animate-fade-in">
                    <h3 class="text-lg font-bold mb-4 text-slate-800">${title}</h3>
                     <pre class="whitespace-pre-wrap text-xs text-left text-slate-700 font-mono overflow-auto max-h-96">${JSON.stringify(data, null, 2)}</pre>
                </div>
             `;
        }

        const formatValue = (key, value) => {
            if (this.activeCategory === 'Attendance') {
                const lowerKey = key.toLowerCase();
                if ((lowerKey.includes('avg') || lowerKey.includes('points') || lowerKey.includes('hours')) && typeof value === 'number') {
                    return value.toFixed(2);
                }
            }
            return value;
        };

        const summaryHtml = Object.entries(data.summary || {}).map(([key, value]) => `
            <div class="bg-slate-50 p-4 rounded-lg">
                <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">${key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p class="text-2xl font-bold text-slate-800">${formatValue(key, value)}</p>
            </div>
        `).join('');
        console.log("debug :: highlightsHtml", data.highlights);
        const highlightsHtml = Object.entries(data.highlights || {}).map(([key, value]) => {
            if (!value) return '';


            const label = key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();

            let contentHtml = '';
            if (typeof value === 'object' && value !== null) {

                contentHtml = `<div class="space-y-1">` +
                    Object.entries(value).map(([k, v]) => `
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-500 capitalize">${k}:</span>
                            <span class="font-semibold text-slate-800">${formatValue(k, v)}</span>
                        </div>
                    `).join('') +
                    `</div>`;
            } else {
                contentHtml = `<p class="text-xl font-bold text-slate-800 mt-1">${formatValue(key, value)}</p>`;
            }

            return `
            <div class="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                 <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">${label}</p>
                 ${contentHtml}
            </div>
            `;
        }).join('');

        return `
            <div class="space-y-6 animate-fade-in">
                 <div class="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 class="text-lg font-bold mb-4 text-slate-800">Summary</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${summaryHtml}
                    </div>
                </div>

                ${highlightsHtml ? `
                <div class="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 class="text-lg font-bold mb-4 text-slate-800">Highlights</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${highlightsHtml}
                    </div>
                </div>
                ` : ''}
                
                <div class="bg-white p-6 rounded-xl border border-slate-200">
                     <h3 class="text-lg font-bold mb-4 text-slate-800">Details</h3>
                     <div class="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar p-1">
                        ${(data.details || []).map(item => {
            let extra = '';
            const leavesData = item.leaveTypes || item.leaveTypeDays;
            if (leavesData && typeof leavesData === 'object') {
                extra += `<div class="mt-3 pt-2 border-t border-slate-100">
                                <p class="text-xs font-semibold text-slate-500 mb-2">Leave Breakdown</p>
                                <div class="flex flex-wrap gap-2">` +
                    Object.entries(leavesData).map(([k, v]) => `<span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">${k}: ${v} Leaves</span>`).join('') +
                    `</div></div>`;
            }

            if (item.components) {
                extra += `<div class="mt-3 pt-2 border-t border-slate-100">
                                <p class="text-xs font-semibold text-slate-500 mb-2">Salary Breakdown</p>
                                <div class="flex flex-wrap gap-2">` +
                    Object.entries(item.components).map(([k, v]) => `<span class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-100">${k}: ₹${v.toLocaleString()}</span>`).join('') +
                    `</div></div>`;
            }

            // Filter tech keys to show relevant stats
            const kv = Object.entries(item)
                .filter(([k]) => !['components', 'leaveTypes', 'leaveTypeDays', 'employees', 'userSkills', 'name', 'userId', 'departmentName', 'userName', 'id', 'entryDate', 'exitDate'].includes(k))
                .map(([k, v]) => {
                    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                    let val = formatValue(k, v);
                    if (k.toLowerCase().includes('date')) {
                        const d = new Date(v);
                        if (!isNaN(d.getTime())) {
                            val = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                        }
                    }
                    return `<div class="flex justify-between items-center py-1"><span class="text-slate-500">${label}</span><span class="font-medium text-slate-800">${val}</span></div>`;
                }).join('');

            const name = item.name || item.userName || (item.entryDate ? new Date(item.entryDate).toLocaleDateString() : 'Record');
            const sub = item.departmentName || (item.role ? item.role : '');

            return `
                                <div class="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-slate-50/50">
                                    <div class="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                                        <div>
                                            <h4 class="font-bold text-slate-800">${name}</h4>
                                            ${sub ? `<p class="text-xs text-slate-500">${sub}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                        ${kv}
                                    </div>
                                    ${extra}
                                </div>
                            `;
        }).join('')}
                     </div>
                     
                     <details class="mt-4">
                        <summary class="cursor-pointer text-blue-600 text-xs font-medium mb-2">Debug JSON</summary>
                        <pre class="whitespace-pre-wrap text-[10px] text-left text-slate-700 font-mono overflow-auto max-h-40 bg-slate-50 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
                     </details>
                </div>
            </div>
        `;
    }
}

customElements.define("app-analysis-view", AnalysisView);
