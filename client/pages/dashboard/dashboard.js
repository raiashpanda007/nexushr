import "../../scripts/Components/Header/Header.js";
import "../../scripts/Components/Sidebar.js";

// Views are now dynamically imported
import "../../scripts/Components/Cards/Modals/EditDepartmentModal.js";
import "../../scripts/Components/Cards/Modals/EditSkillModal.js";
import "../../scripts/Components/Cards/Modals/EditLeaveTypeModal.js";
import "../../scripts/Components/Cards/Modals/AddSalaryModal.js";
import "../../scripts/Components/Cards/Modals/EditSalaryModal.js";
import "../../scripts/Components/Cards/Modals/GeneratePayrollModal.js";

import {
  permissions,
  userHandler,
  deptHandler,
  skillHandler,
  leaveTypeHandler,
  salaryHandler,
  payrollHandler,
  networkState,
} from "../../scripts/Core/startup.js";
import {
  CreateDepartmentErrorCustomEvent,
  CreateDepartmentSuccessEvent,
  CreateSkillErrorCustomEvent,
  CreateSkillSuccessEvent,
  CreateLeaveTypeErrorCustomEvent,
  CreateLeaveTypeSuccessEvent,
  CreateUserErrorCustomEvent,
  CreateUserSuccessEvent,
  EditUserErrorCustomEvent,
  EditUserSuccessEvent,
  EditDepartmentErrorCustomEvent,
  EditDepartmentSuccessEvent,
  EditSkillErrorCustomEvent,
  EditSkillSuccessEvent,
  EditLeaveTypeErrorCustomEvent,
  EditLeaveTypeSuccessEvent,
  CreateSalaryErrorCustomEvent,
  CreateSalarySuccessEvent,
  EditSalaryErrorCustomEvent,
  EditSalarySuccessEvent,
  CreatePayrollErrorCustomEvent,
  CreatePayrollSuccessEvent,
} from "../../scripts/events.js";

const views = {
  "nav-employees": { tag: "app-employees-view", path: "../../scripts/Components/Views/EmployeesView.js" },
  "nav-departments": { tag: "app-departments-view", path: "../../scripts/Components/Views/DepartmentsView.js" },
  "nav-skills": { tag: "app-skills-view", path: "../../scripts/Components/Views/SkillsView.js" },
  "nav-leaves": { tag: "app-leaves-view", path: "../../scripts/Components/Views/LeavesView.js" },
  "nav-attendance": { tag: "app-attendance-view", path: "../../scripts/Components/Views/AttendanceView.js" },
  "nav-salaries": { tag: "app-salaries-view", path: "../../scripts/Components/Views/SalariesView.js" },
  "nav-payroll": { tag: "app-payroll-view", path: "../../scripts/Components/Views/PayrollView.js" },
  "nav-analysis": { tag: "app-analysis-view", path: "../../scripts/Components/Views/AnalysisView.js" },
};


// Use a static version for production caching.
// Change this value (e.g., "1.0.1") to force all users to redownload the views.
// For development: Use the "Disable Cache" option in browser DevTools to see changes immediately.
const APP_VERSION = "1.0.0";

async function loadView(event) {

  document.querySelectorAll(".view-section").forEach((el) => el.classList.add("hidden"));

  const viewConfig = views[event];
  if (!viewConfig) return;


  let loader = document.querySelector("app-loader");
  if (!loader) {
    // Also cache-bust the loader
    await import("../../scripts/Components/Loader.js?v=" + APP_VERSION);
    loader = document.createElement("app-loader");
    document.body.appendChild(loader);
  }
  loader.style.display = "flex";

  try {

    // cache-bust the view module
    await import(viewConfig.path + "?v=" + APP_VERSION);

    const target = document.querySelector(viewConfig.tag);
    if (target) {
      target.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading view:", error);
  } finally {
    if (loader) loader.style.display = "none";
  }
}

Object.keys(views).forEach((event) => {
  document.addEventListener(event, () => loadView(event));
});

document.addEventListener("sidebar-toggle", (e) => {
  const main = document.getElementById("main-content");
  if (e.detail.collapsed) {
    main.classList.remove("ml-64");
    main.classList.add("ml-20");
  } else {
    main.classList.remove("ml-20");
    main.classList.add("ml-64");
  }
});

document.addEventListener("create-dept", async (event) => {
  const { ok, data } = await permissions.CreateDept(
    event.detail.name,
    event.detail.description,
  );
  console.log({ ok, data });
  const DeptForm = document.querySelector("app-add-dept-modal");
  !ok
    ? DeptForm.dispatchEvent(CreateDepartmentErrorCustomEvent(data))
    : DeptForm.dispatchEvent(CreateDepartmentSuccessEvent());
});

document.addEventListener("create-skill", async (event) => {
  console.log("create-skill triggered:: ", event);
  const { ok, data } = await permissions.CreateSkill(
    event.detail.name,
    event.detail.description,
  );
  console.log({ ok, data });
  const SkillForm = document.querySelector("app-add-skill-modal");
  !ok
    ? SkillForm.dispatchEvent(CreateSkillErrorCustomEvent(data))
    : SkillForm.dispatchEvent(CreateSkillSuccessEvent());
});

document.addEventListener("create-leave-type", async (event) => {
  console.log("create-leave-type triggered:: ", event);
  const { ok, data } = await permissions.CreateLeaveType(
    event.detail.code,
    event.detail.name,
    event.detail.length,
  );
  console.log({ ok, data });
  const LeaveTypeForm = document.querySelector("app-add-leave-type-modal");
  !ok
    ? LeaveTypeForm.dispatchEvent(CreateLeaveTypeErrorCustomEvent(data))
    : LeaveTypeForm.dispatchEvent(CreateLeaveTypeSuccessEvent());
});

document.addEventListener("create-user", async (event) => {
  console.log("create-user triggered:: ", event);
  const UserForm = document.querySelector("app-add-user-modal");
  function UserCreatedEvent() {
    document.querySelector("app-show-all-users").dispatchEvent(
      new CustomEvent("refresh-users", {
        detail: {
          email: event.detail.email,
          firstName: event.detail.firstName,
          lastName: event.detail.lastName,
          department: event.detail.department,
          skills: event.detail.skills,
          profilePhoto: event.detail.profilePhoto,
          note: event.detail.note,
        },
        bubbles: true,
        composed: true,
      }),
      UserForm.dispatchEvent(CreateUserSuccessEvent()),
    );
  }
  const { ok, data } = await permissions.CreateUser(
    event.detail.email,
    event.detail.firstName,
    event.detail.lastName,
    event.detail.password,
    event.detail.skills,
    event.detail.profilePhoto,
    event.detail.note,
    event.detail.department,
  );
  console.log({ ok, data });

  !ok
    ? UserForm.dispatchEvent(CreateUserErrorCustomEvent(data))
    : UserCreatedEvent();
});

document.addEventListener("edit-user", async (event) => {
  console.log("edit-user triggered:: ", event);
  const {
    id,
    email,
    firstName,
    lastName,
    password,
    profilePhoto,
    note,
    skills,
    department,
  } = event.detail;
  const { ok, data } = await userHandler.EditUser(
    id,
    email,
    firstName,
    lastName,
    password,
    profilePhoto,
    note,
    skills,
    department,
  );
  console.log({ ok, data });
  const EditUserForm = document.querySelector("app-edit-user-modal");
  !ok
    ? EditUserForm.dispatchEvent(EditUserErrorCustomEvent(data))
    : EditUserForm.dispatchEvent(EditUserSuccessEvent());
});

document.addEventListener("edit-dept", async (event) => {
  console.log("edit-dept triggered:: ", event);
  const { id, name, description } = event.detail;
  const { ok, data } = await deptHandler.EditDepartment(id, name, description);
  console.log({ ok, data });
  const EditDeptForm = document.querySelector("app-edit-dept-modal");
  !ok
    ? EditDeptForm.dispatchEvent(EditDepartmentErrorCustomEvent(data))
    : EditDeptForm.dispatchEvent(EditDepartmentSuccessEvent());
});

document.addEventListener("edit-skill", async (event) => {
  console.log("edit-skill triggered:: ", event);
  const { id, name, category } = event.detail;
  const { ok, data } = await skillHandler.EditSkill(id, name, category);
  console.log({ ok, data });
  const EditSkillForm = document.querySelector("app-edit-skill-modal");
  !ok
    ? EditSkillForm.dispatchEvent(EditSkillErrorCustomEvent(data))
    : EditSkillForm.dispatchEvent(EditSkillSuccessEvent());
});

document.addEventListener("edit-leave-type", async (event) => {
  console.log("edit-leave-type triggered:: ", event);
  const { id, code, name, length } = event.detail;
  const { ok, data } = await leaveTypeHandler.EditLeaveType(
    id,
    code,
    name,
    length,
  );
  console.log({ ok, data });
  const EditLeaveTypeForm = document.querySelector("app-edit-leave-type-modal");
  !ok
    ? EditLeaveTypeForm.dispatchEvent(EditLeaveTypeErrorCustomEvent(data))
    : EditLeaveTypeForm.dispatchEvent(EditLeaveTypeSuccessEvent());
});

document.addEventListener("create-salary", async (event) => {
  console.log("create-salary triggered:: ", event);
  const {
    userId,
    base,
    hra,
    lta,
    userFirstName,
    userLastName,
    userDepartment,
  } = event.detail;
  const { ok, data } = await salaryHandler.CreateSalary(
    userId,
    base,
    hra,
    lta,
    userFirstName,
    userLastName,
    userDepartment,
  );
  console.log({ ok, data });
  const AddSalaryForm = document.querySelector("app-add-salary-modal");
  !ok
    ? AddSalaryForm.dispatchEvent(CreateSalaryErrorCustomEvent(data))
    : AddSalaryForm.dispatchEvent(CreateSalarySuccessEvent());
});

document.addEventListener("edit-salary", async (event) => {
  console.log("edit-salary triggered:: ", event);
  const { id, base, hra, lta } = event.detail;
  const { ok, data } = await salaryHandler.EditSalary(id, base, hra, lta);
  console.log({ ok, data });
  const EditSalaryForm = document.querySelector("app-edit-salary-modal");
  !ok
    ? EditSalaryForm.dispatchEvent(EditSalaryErrorCustomEvent(data))
    : EditSalaryForm.dispatchEvent(EditSalarySuccessEvent());
});

document.addEventListener("create-payroll", async (event) => {
  console.log("create-payroll triggered:: ", event);
  const {
    userId,
    userFirstName,
    userLastName,
    month,
    year,
    salary,
    bonuses,
    deductions,
    total,
  } = event.detail;
  const { ok, data } = await payrollHandler.CreatePayroll(
    userId,
    userFirstName,
    userLastName,
    month,
    year,
    salary,
    bonuses,
    deductions,
    total,
  );
  console.log({ ok, data });
  const GeneratePayrollForm = document.querySelector(
    "app-generate-payroll-modal",
  );
  !ok
    ? GeneratePayrollForm.dispatchEvent(CreatePayrollErrorCustomEvent(data))
    : GeneratePayrollForm.dispatchEvent(CreatePayrollSuccessEvent());
});

document.addEventListener("network-status-changed", (event) => {
  console.log("Network status changed: ", event.detail.isOnline);
  event.detail.isOnline ? networkState.SetOnline() : networkState.SetOffline();
});
