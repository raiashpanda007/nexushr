import { authState, attendanceHandler } from "../Core/startup.js";

const SidebarTemplate = document.createElement("template");
SidebarTemplate.innerHTML = `
<aside id="sidebar" class="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-20 transition-all duration-300 ease-in-out">
    <div class="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <h1 id="sidebar-logo" class="text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300">Nexus<span class="text-blue-600">HR</span></h1>
        <button id="toggle-btn" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none">
            <svg id="toggle-icon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
        </button>
    </div>
    
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden" id="sidebar-nav">
    </nav>

    <div class="p-3 border-t border-slate-100 shrink-0">
        <div id="user-profile" class="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden">
             <div class="w-8 h-8 min-w-[2rem] rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0" id="user-avatar">
                U
             </div>
             <div class="flex-1 min-w-0 transition-opacity duration-300" id="user-info">
                <p class="text-sm font-medium text-slate-900 truncate" id="user-name">User</p>
                <p class="text-xs text-slate-500 truncate" id="user-role">Role</p>
             </div>
        </div>
        <button id="logout-btn" class="flex items-center w-full px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors overflow-hidden group">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 min-w-[1.25rem] mr-3 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="whitespace-nowrap transition-opacity duration-300" id="logout-text">Logout</span>
        </button>
    </div>
</aside>
`;

class Sidebar extends HTMLElement {
    constructor() {
        super();
        this.appendChild(SidebarTemplate.content.cloneNode(true));
        this.collapsed = false;
    }

    connectedCallback() {
        const nav = this.querySelector("#sidebar-nav");
        const { ok, data } = authState.GetCurrUserState();

        if (!ok || !data) {
            window.location.href = "/";
            return;
        }

        const role = data.user.role;
        const firstName = data.user.firstName || "User";
        const lastName = data.user.lastName || "";

        this.querySelector("#user-name").textContent = `${firstName} ${lastName}`;
        this.querySelector("#user-role").textContent = role;
        this.querySelector("#user-avatar").textContent = firstName.charAt(0).toUpperCase();

        this.renderLinks(nav, role);

        this.querySelector("#logout-btn").addEventListener("click", async () => {
            const { ok, data } = authState.GetCurrUserState();
            if (ok && data && data.user) {
                await authState.LogOut();
            }
            window.location.href = "/";
        });

        this.querySelector("#toggle-btn").addEventListener("click", () => {
            this.toggle();
        });
    }

    toggle() {
        this.collapsed = !this.collapsed;
        const sidebar = this.querySelector("#sidebar");
        const logo = this.querySelector("#sidebar-logo");
        const toggleIcon = this.querySelector("#toggle-icon");
        const userInfo = this.querySelector("#user-info");
        const logoutText = this.querySelector("#logout-text");
        const navTexts = this.querySelectorAll(".nav-text");
        const logoutBtn = this.querySelector("#logout-btn");
        const userProfile = this.querySelector("#user-profile");
        const header = document.querySelector("app-header");

        if (this.collapsed) {
            sidebar.classList.replace("w-64", "w-20");
            logo.classList.add("opacity-0", "w-0", "hidden");
            toggleIcon.classList.add("rotate-180");

            userInfo.classList.add("hidden");
            logoutText.classList.add("hidden");
            navTexts.forEach(t => t.classList.add("hidden"));

            console.log("::::debug header :::::", header);
            header.querySelector("#header-logo").classList.remove("hidden");

            // Center items
            this.querySelectorAll("nav button").forEach(btn => {
                btn.classList.add("justify-center", "px-2");
                btn.classList.remove("px-4");
                btn.querySelector("span:first-child").classList.remove("mr-3");
            });

            logoutBtn.classList.add("justify-center", "px-2");
            logoutBtn.classList.remove("px-3");
            logoutBtn.querySelector("svg").classList.remove("mr-3");

            userProfile.classList.add("justify-center", "px-2");
            userProfile.classList.remove("px-3");

        } else {
            sidebar.classList.replace("w-20", "w-64");
            logo.classList.remove("opacity-0", "w-0", "hidden");
            toggleIcon.classList.remove("rotate-180");
            header.querySelector("#header-logo").classList.add("hidden");
            userInfo.classList.remove("hidden");
            logoutText.classList.remove("hidden");
            navTexts.forEach(t => t.classList.remove("hidden"));

            this.querySelectorAll("nav button").forEach(btn => {
                btn.classList.remove("justify-center", "px-2");
                btn.classList.add("px-4");
                btn.querySelector("span:first-child").classList.add("mr-3");
            });

            logoutBtn.classList.remove("justify-center", "px-2");
            logoutBtn.classList.add("px-3");
            logoutBtn.querySelector("svg").classList.add("mr-3");

            userProfile.classList.remove("justify-center", "px-2");
            userProfile.classList.add("px-3");
        }

        this.dispatchEvent(new CustomEvent("sidebar-toggle", {
            detail: { collapsed: this.collapsed },
            bubbles: true,
            composed: true
        }));
    }

    renderLinks(nav, role) {
        nav.innerHTML = "";
        let links = [];

        if (role === "HR") {
            links = [
                { name: "Employees", event: "nav-employees", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>` },
                { name: "Departments", event: "nav-departments", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>` },
                { name: "Leaves", event: "nav-leaves", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` },
                { name: "Skills", event: "nav-skills", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>` },
                { name: "Salaries", event: "nav-salaries", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
                { name: "Payroll", event: "nav-payroll", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` },
                { name: "Analysis", event: "nav-analysis", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>` }
            ];
        } else {
            // Employee
            links = [
                { name: "Attendance", event: "nav-attendance", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
                { name: "Leaves", event: "nav-leaves", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` },
                { name: "Salaries", event: "nav-salaries", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
                { name: "Payroll", event: "nav-payroll", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` }
            ];
        }

        links.forEach((link, index) => {
            const btn = document.createElement("button");
            btn.className = "flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors group";
            btn.innerHTML = `
                <span class="mr-3 text-slate-400 group-hover:text-blue-600 transition-colors">${link.icon}</span>
                <span class="nav-text transition-all duration-300 whitespace-nowrap">${link.name}</span>
            `;
            btn.dataset.event = link.event;

            btn.addEventListener("click", () => {

                nav.querySelectorAll("button").forEach(b => {
                    b.classList.remove("bg-blue-50", "text-blue-600");
                    b.classList.add("text-slate-600");
                    b.querySelector("span").classList.remove("text-blue-600");
                    b.querySelector("span").classList.add("text-slate-400");
                });

                btn.classList.remove("text-slate-600");
                btn.classList.add("bg-blue-50", "text-blue-600");
                btn.querySelector("span").classList.remove("text-slate-400");
                btn.querySelector("span").classList.add("text-blue-600");

                this.dispatchEvent(new CustomEvent(link.event, { bubbles: true, composed: true }));
            });
            nav.appendChild(btn);
        });
        // yaha pr macrotask queue ka use kiya gya dekhlena jb sir maangenge
        if (nav.firstElementChild) {
            setTimeout(() => {
                nav.firstElementChild.click();
            }, 0);
        }
    }
}

customElements.define("app-sidebar", Sidebar);
