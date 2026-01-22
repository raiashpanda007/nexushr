import { EditUserCustomEvent } from "../../../events.js";
import { deptHandler, skillHandler } from "../../../Core/startup.js";

const EditUserTemplate = document.createElement("template");

EditUserTemplate.innerHTML = `
  <form id="edit-user-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="modal-panel">
          
          <!-- Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-slate-900" id="modal-title">Edit User</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">Update user details.</p>
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
            <div id="edit-user-form" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="firstName" class="block text-sm font-medium leading-6 text-slate-900">First Name</label>
                    <div class="mt-2">
                    <input type="text" name="firstName" id="firstName" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="John" required>
                    </div>
                </div>
                <div>
                    <label for="lastName" class="block text-sm font-medium leading-6 text-slate-900">Last Name</label>
                    <div class="mt-2">
                    <input type="text" name="lastName" id="lastName" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="Doe" required>
                    </div>
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium leading-6 text-slate-900">Email</label>
                <div class="mt-2">
                  <input type="email" name="email" id="email" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="john.doe@example.com" required>
                </div>
              </div>

              <div>
                <label for="password" class="block text-sm font-medium leading-6 text-slate-900">Password <span class="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span></label>
                <div class="mt-2">
                  <input type="password" name="password" id="password" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:p-2" placeholder="********">
                </div>
              </div>

              <div>
                <label for="dept" class="block text-sm font-medium leading-6 text-slate-900">Department</label>
                <div class="mt-2">
                  <select name="dept" id="dept" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all" required>
                    <option value="" disabled selected>Select a Department</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium leading-6 text-slate-900 mb-2">Skills</label>
                <div id="skills-container" class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                    <p class="text-xs text-slate-500 col-span-2">Loading skills...</p>
                </div>
              </div>
              
              <div>
                <label for="note" class="block text-sm font-medium leading-6 text-slate-900">Note</label>
                <div class="mt-2">
                  <textarea id="note" name="note" rows="3" class="block p-2 w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all placeholder:px-1" placeholder="Additional notes..."></textarea>
                </div>
              </div>
              <span class="text-red-500 font-semibold hidden" id="errorUserForm"></span>
            </div>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
            <button type="submit" class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">Save Changes</button>
            <button type="button" id="cancel-user-modal-btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all duration-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </form>
`;

class EditUserModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(EditUserTemplate.content.cloneNode(true));
    this.currentUser = null;
  }
  connectedCallback() {
    console.log("EditUserModal connectedCallback");
    const modal = this.querySelector("#edit-user-modal");
    const backdrop = this.querySelector("#modal-backdrop");
    const panel = this.querySelector("#modal-panel");
    const closeBtn = this.querySelector("#close-modal-btn");
    const cancelBtn = this.querySelector("#cancel-user-modal-btn");
    const userEditForm = this.querySelector('form');
    const errUser = this.querySelector("#errorUserForm");
    const skillsContainer = this.querySelector("#skills-container");
    const deptSelect = this.querySelector("#dept");
    let selectedSkills = new Set();
    let allSkills = [];

    let allDepartments = [];

    // Session storage key
    const STORAGE_KEY = "editUserForm";

    // Save form data to session storage
    const saveFormData = () => {
      if (!this.currentUser) return;
      const data = {
        userId: this.currentUser.id,
        firstName: this.querySelector("#firstName").value,
        lastName: this.querySelector("#lastName").value,
        email: this.querySelector("#email").value,
        password: this.querySelector("#password").value,
        note: this.querySelector("#note").value,
        deptId: deptSelect.value,
        selectedSkills: Array.from(selectedSkills)
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // Restore form data from session storage
    const restoreFormData = () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData && this.currentUser) {
        try {
          const data = JSON.parse(savedData);
          // Only restore if it's for the same user
          if (data.userId === this.currentUser.id) {
            if (data.firstName) this.querySelector("#firstName").value = data.firstName;
            if (data.lastName) this.querySelector("#lastName").value = data.lastName;
            if (data.email) this.querySelector("#email").value = data.email;
            if (data.password) this.querySelector("#password").value = data.password;
            if (data.note) this.querySelector("#note").value = data.note;
            if (data.deptId) deptSelect.value = data.deptId;
            if (data.selectedSkills) {
              selectedSkills = new Set(data.selectedSkills);
            }
          }
        } catch (e) {
          console.error("Failed to restore form data:", e);
        }
      }
    };

    // Clear session storage
    const clearFormData = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    // Listen for input changes to save to session storage
    userEditForm.addEventListener('input', saveFormData);
    userEditForm.addEventListener('change', saveFormData);

    const loadDepartments = async (selectedDeptId) => {
      const res = await deptHandler.GetAllDepartments();
      console.log("departments fetched :: ", res.data);
      if (res.ok) {
        allDepartments = res.data;
        deptSelect.innerHTML = '<option value="" disabled>Select a Department</option>';
        res.data.forEach(dept => {
          const option = document.createElement("option");
          option.value = dept.id;
          option.textContent = dept.name;
          if (dept.id === selectedDeptId) {
            option.selected = true;
          }
          deptSelect.appendChild(option);
        })
      } else {
        console.error("Failed to fetch departments:", res.data);
      }
    };

    const renderSkills = () => {
      skillsContainer.innerHTML = "";
      if (allSkills.length === 0) {
        skillsContainer.innerHTML = '<p class="text-xs text-slate-500 col-span-2">No skills available</p>';
        return;
      }

      allSkills.forEach(skill => {
        const skillDiv = document.createElement("div");
        skillDiv.className = `flex items-center p-2 rounded cursor-pointer border transition-all ${selectedSkills.has(skill.id) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2";
        checkbox.checked = selectedSkills.has(skill.id);

        // Prevent checkbox click from bubbling twice if we handle div click
        checkbox.addEventListener("click", (e) => e.stopPropagation());
        checkbox.addEventListener("change", () => toggleSkill(skill.id));

        const label = document.createElement("span");
        label.className = "text-sm font-medium select-none";
        label.textContent = skill.name;

        skillDiv.appendChild(checkbox);
        skillDiv.appendChild(label);

        skillDiv.addEventListener("click", () => {
          checkbox.checked = !checkbox.checked;
          toggleSkill(skill.id);
        });

        skillsContainer.appendChild(skillDiv);
      });
    };

    const toggleSkill = (skillId) => {
      if (selectedSkills.has(skillId)) {
        selectedSkills.delete(skillId);
      } else {
        selectedSkills.add(skillId);
      }
      renderSkills();
    };

    const loadSkills = async (userSkills) => {
      const res = await skillHandler.GetAllSkills();
      if (res.ok) {
        allSkills = res.data;
        selectedSkills.clear();

        if (userSkills) {
          if (Array.isArray(userSkills)) {
            userSkills.forEach(s => {
              if (typeof s === 'object' && s.id) {
                selectedSkills.add(s.id);
              } else if (typeof s === 'string') {
                // Try to find skill by name if stored as string, or assume it's an ID
                if (found) selectedSkills.add(found.id);
              }
            });
          }
        }
        renderSkills();
      } else {
        skillsContainer.innerHTML = '<p class="text-xs text-red-500 col-span-2">Failed to load skills</p>';
      }
    };

    const openModal = (user) => {
      this.currentUser = user;

      this.querySelector("#firstName").value = user.firstName || "";
      this.querySelector("#lastName").value = user.lastName || "";
      this.querySelector("#email").value = user.email || "";
      this.querySelector("#password").value = ""; // Clear password field
      this.querySelector("#note").value = user.note || "";

      const deptId = user.deptId || (user.department ? user.department.id : "");
      loadDepartments(deptId);
      loadSkills(user.skills);

      // Restore form data after initial load
      setTimeout(() => restoreFormData(), 100);

      modal.classList.remove("hidden");
      errUser.classList.add("hidden");
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
        userEditForm.reset();
        this.currentUser = null;
        selectedSkills.clear();
        // Don't clear session storage on cancel - only on success
      }, 300);
    };

    document.addEventListener("edit-user-modal", (event) => {
      console.log("edit-user-modal event received in EditUserModal", event.detail);
      if (event.detail && event.detail.user) {
        openModal(event.detail.user);
      }
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    if (backdrop) {
      backdrop.addEventListener("click", closeModal);
    }

    // ESC key to close modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    userEditForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.currentUser) return;
      console.log("Form submitted in EditUserModal", e);
      const formData = new FormData(userEditForm);
      const firstName = formData.get("firstName").trim();
      const lastName = formData.get("lastName").trim();
      const email = formData.get("email").trim();
      let password = formData.get("password").trim();
      const deptId = formData.get("dept");
      const note = formData.get("note").trim();

      if (!firstName || !lastName || !email || !deptId) {
        errUser.classList.remove("hidden");
        errUser.textContent = "Please fill in all required fields with valid values.";
        return;
      }

      if (!password) {
        password = this.currentUser.password;
      }

      const profilePhoto = this.currentUser.profilePhoto;

      const skills = allSkills.filter(s => selectedSkills.has(s.id));

      const department = allDepartments.find(d => d.id === deptId) || this.currentUser.department;

      this.dispatchEvent(EditUserCustomEvent(
        this.currentUser.id,
        email,
        firstName,
        lastName,
        password,
        profilePhoto,
        note,
        skills,
        department
      ));
    });

    this.addEventListener("edit-user-err", (event) => {
      errUser.classList.remove("hidden");
      errUser.textContent = event.detail.error;
    });

    this.addEventListener("edit-user-success", () => {
      clearFormData(); // Clear session storage on success
      closeModal();
    });
  }
}
customElements.define("app-edit-user-modal", EditUserModal);
