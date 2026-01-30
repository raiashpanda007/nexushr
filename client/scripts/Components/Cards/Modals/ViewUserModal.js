import { deptHandler, skillHandler } from "../../../Core/startup.js";

const ViewUserTemplate = document.createElement("template");

ViewUserTemplate.innerHTML = `
  <div id="view-user-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div id="cancel-backdrop" class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="modal-panel">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">Employee Details</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Full profile information.</p>
                </div>
              </div>
              <button type="button" id="close-modal-btn" class="absolute top-4 right-4 text-slate-400 hover:text-slate-500 transition-colors">
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="bg-white px-4 py-6 sm:p-6">
            <div class="space-y-6">
              <!-- Profile Photo -->
              <div class="flex justify-center">
                <div class="h-32 w-32 rounded-full ring-4 ring-slate-50 shadow-lg overflow-hidden relative group">
                    <img id="view-profile-photo" src="" alt="Profile Photo" class="h-full w-full object-cover">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">First Name</label>
                    <div id="view-firstName" class="text-slate-900 font-medium text-base p-2 bg-slate-50 rounded-lg border border-slate-100"></div>
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Last Name</label>
                    <div id="view-lastName" class="text-slate-900 font-medium text-base p-2 bg-slate-50 rounded-lg border border-slate-100"></div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Email Address</label>
                <div id="view-email" class="text-slate-900 font-medium text-base p-2 bg-slate-50 rounded-lg border border-slate-100 break-all"></div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Department</label>
                <div id="view-dept" class="text-slate-900 font-medium text-base p-2 bg-slate-50 rounded-lg border border-slate-100"></div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Skills</label>
                <div id="view-skills-container" class="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 min-h-[3rem]">
                    <span class="text-sm text-slate-400 italic">No skills listed</span>
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Note</label>
                <div id="view-note" class="text-slate-700 text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 min-h-[4rem] whitespace-pre-wrap"></div>
              </div>

            </div>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="button" id="close-modal-footer-btn" class="inline-flex w-full justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto transition-all">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

class ViewUserModal extends HTMLElement {
    constructor() {
        super();
        this.appendChild(ViewUserTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        const modal = this.querySelector("#view-user-modal");
        const backdrop = this.querySelector("#modal-backdrop");
        const panel = this.querySelector("#modal-panel");
        const closeBtn = this.querySelector("#close-modal-btn");
        const closeFooterBtn = this.querySelector("#close-modal-footer-btn");
        const cancelBackdrop = this.querySelector("#cancel-backdrop");

        const firstNameEl = this.querySelector("#view-firstName");
        const lastNameEl = this.querySelector("#view-lastName");
        const emailEl = this.querySelector("#view-email");
        const deptEl = this.querySelector("#view-dept");
        const skillsContainer = this.querySelector("#view-skills-container");
        const noteEl = this.querySelector("#view-note");
        const photoImg = this.querySelector("#view-profile-photo");

        const openModal = (user) => {
            // Populate fields
            firstNameEl.textContent = user.firstName || "-";
            lastNameEl.textContent = user.lastName || "-";
            emailEl.textContent = user.email || "-";
            deptEl.textContent = user.department ? user.department.name : (user.deptId || "-");
            noteEl.textContent = user.note || "No notes.";

            // Skills
            skillsContainer.innerHTML = '';
            if (user.skills && user.skills.length > 0) {
                user.skills.forEach(skill => {
                    const skillName = typeof skill === 'string' ? skill : skill.name;
                    const span = document.createElement("span");
                    span.className = "inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10";
                    span.textContent = skillName;
                    skillsContainer.appendChild(span);
                });
            } else {
                skillsContainer.innerHTML = '<span class="text-sm text-slate-400 italic">No skills listed</span>';
            }

            // Profile Photo
            if (user.profilePhoto) {
                try {
                    if (user.profilePhoto instanceof Blob || user.profilePhoto instanceof File) {
                        photoImg.src = URL.createObjectURL(user.profilePhoto);
                    } else {
                        photoImg.src = user.profilePhoto;
                    }
                } catch (e) {
                    photoImg.src = "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent((user.firstName || 'U') + ' ' + (user.lastName || ''));
                }
            } else {
                photoImg.src = "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent((user.firstName || 'U') + ' ' + (user.lastName || ''));
            }

            modal.classList.remove("hidden");

            // Animation
            requestAnimationFrame(() => {
                backdrop.classList.remove("opacity-0");
                panel.classList.remove("opacity-0", "translate-y-4", "sm:translate-y-0", "sm:scale-95");
                panel.classList.add("opacity-100", "translate-y-0", "sm:scale-100");
            });
        };

        const closeModal = () => {
            backdrop.classList.add("opacity-0");
            panel.classList.remove("opacity-100", "translate-y-0", "sm:scale-100");
            panel.classList.add("opacity-0", "translate-y-4", "sm:translate-y-0", "sm:scale-95");

            setTimeout(() => {
                modal.classList.add("hidden");
                photoImg.src = "";
            }, 300);
        };

        // Global Event Listener
        document.addEventListener("open-view-user-modal", (event) => {
            if (event.detail && event.detail.user) {
                openModal(event.detail.user);
            }
        });

        closeBtn.addEventListener("click", closeModal);
        closeFooterBtn.addEventListener("click", closeModal);

        cancelBackdrop.addEventListener("click", (e) => {
            if (e.target === cancelBackdrop) closeModal();
        });

        // ESC key
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                closeModal();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
    }
}

customElements.define("app-view-user-modal", ViewUserModal);
