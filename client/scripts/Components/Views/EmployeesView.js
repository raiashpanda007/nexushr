import "../Cards/HRDashboardCreateUser.js";
import "../Cards/ShowAllUsers.js";
import "../Cards/Modals/AddUserForm.js";
import "../Cards/Modals/EditUserModal.js";

const EmployeesViewTemplate = document.createElement("template");
EmployeesViewTemplate.innerHTML = `
    <div class="w-full">
        <app-dashboard-hr-create-user></app-dashboard-hr-create-user>
        <app-show-all-users></app-show-all-users>
        <app-add-user-modal></app-add-user-modal>
        <app-edit-user-modal></app-edit-user-modal>
    </div>
`;

class EmployeesView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(EmployeesViewTemplate.content.cloneNode(true));
    }
}

customElements.define("app-employees-view", EmployeesView);
