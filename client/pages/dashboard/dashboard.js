import "../../scripts/Components/Header/Header.js"
import "../../scripts/Components/Sidebar.js";
import "../../scripts/Components/Views/EmployeesView.js";
import "../../scripts/Components/Views/DepartmentsView.js";
import "../../scripts/Components/Views/SkillsView.js";
import "../../scripts/Components/Views/LeavesView.js";
import "../../scripts/Components/Views/AttendanceView.js";
import "../../scripts/Components/Cards/Modals/EditDepartmentModal.js";
import "../../scripts/Components/Cards/Modals/EditSkillModal.js";
import "../../scripts/Components/Cards/Modals/EditLeaveTypeModal.js";

import { permissions, userHandler, deptHandler, skillHandler, leaveTypeHandler } from "../../scripts/Core/startup.js";
import { CreateDepartmentErrorCustomEvent, CreateDepartmentSuccessEvent, CreateSkillErrorCustomEvent, CreateSkillSuccessEvent, CreateLeaveTypeErrorCustomEvent, CreateLeaveTypeSuccessEvent, CreateUserErrorCustomEvent, CreateUserSuccessEvent, EditUserErrorCustomEvent, EditUserSuccessEvent, EditDepartmentErrorCustomEvent, EditDepartmentSuccessEvent, EditSkillErrorCustomEvent, EditSkillSuccessEvent, EditLeaveTypeErrorCustomEvent, EditLeaveTypeSuccessEvent } from "../../scripts/events.js"

// Navigation Logic
const views = {
  "nav-employees": "app-employees-view",
  "nav-departments": "app-departments-view",
  "nav-skills": "app-skills-view",
  "nav-leaves": "app-leaves-view",
  "nav-attendance": "app-attendance-view"
};

Object.keys(views).forEach(event => {
  document.addEventListener(event, () => {
    document.querySelectorAll(".view-section").forEach(el => el.classList.add("hidden"));
    const target = document.querySelector(views[event]);
    if (target) target.classList.remove("hidden");
  });
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
  const { ok, data } = await permissions.CreateDept(event.detail.name, event.detail.description);
  console.log({ ok, data });
  const DeptForm = document.querySelector("app-add-dept-modal");
  !ok ? DeptForm.dispatchEvent(CreateDepartmentErrorCustomEvent(data)) : DeptForm.dispatchEvent(CreateDepartmentSuccessEvent());
})

document.addEventListener("create-skill", async (event) => {
  console.log("create-skill triggered:: ", event);
  const { ok, data } = await permissions.CreateSkill(event.detail.name, event.detail.description);
  console.log({ ok, data });
  const SkillForm = document.querySelector("app-add-skill-modal");
  !ok ? SkillForm.dispatchEvent(CreateSkillErrorCustomEvent(data)) : SkillForm.dispatchEvent(CreateSkillSuccessEvent());
})

document.addEventListener("create-leave-type", async (event) => {
  console.log("create-leave-type triggered:: ", event);
  const { ok, data } = await permissions.CreateLeaveType(event.detail.code, event.detail.name, event.detail.length);
  console.log({ ok, data });
  const LeaveTypeForm = document.querySelector("app-add-leave-type-modal");
  !ok ? LeaveTypeForm.dispatchEvent(CreateLeaveTypeErrorCustomEvent(data)) : LeaveTypeForm.dispatchEvent(CreateLeaveTypeSuccessEvent());
})


document.addEventListener("create-user", async (event) => {
  console.log("create-user triggered:: ", event);
  const { ok, data } = await permissions.CreateUser(event.detail.email, event.detail.firstName, event.detail.lastName, event.detail.password, event.detail.skills, event.detail.profilePhoto, event.detail.note, event.detail.department);
  console.log({ ok, data });
  const UserForm = document.querySelector("app-add-user-modal");
  !ok ? UserForm.dispatchEvent(CreateUserErrorCustomEvent(data)) : UserForm.dispatchEvent(CreateUserSuccessEvent());
})



document.addEventListener("edit-user", async (event) => {
  console.log("edit-user triggered:: ", event);
  const { id, email, firstName, lastName, password, profilePhoto, note, skills, department } = event.detail;
  const { ok, data } = await userHandler.EditUser(id, email, firstName, lastName, password, profilePhoto, note, skills, department);
  console.log({ ok, data });
  const EditUserForm = document.querySelector("app-edit-user-modal");
  !ok ? EditUserForm.dispatchEvent(EditUserErrorCustomEvent(data)) : EditUserForm.dispatchEvent(EditUserSuccessEvent());
})

document.addEventListener("edit-dept", async (event) => {
  console.log("edit-dept triggered:: ", event);
  const { id, name, description } = event.detail;
  const { ok, data } = await deptHandler.EditDepartment(id, name, description);
  console.log({ ok, data });
  const EditDeptForm = document.querySelector("app-edit-dept-modal");
  !ok ? EditDeptForm.dispatchEvent(EditDepartmentErrorCustomEvent(data)) : EditDeptForm.dispatchEvent(EditDepartmentSuccessEvent());
})

document.addEventListener("edit-skill", async (event) => {
  console.log("edit-skill triggered:: ", event);
  const { id, name, category } = event.detail;
  const { ok, data } = await skillHandler.EditSkill(id, name, category);
  console.log({ ok, data });
  const EditSkillForm = document.querySelector("app-edit-skill-modal");
  !ok ? EditSkillForm.dispatchEvent(EditSkillErrorCustomEvent(data)) : EditSkillForm.dispatchEvent(EditSkillSuccessEvent());
})

document.addEventListener("edit-leave-type", async (event) => {
  console.log("edit-leave-type triggered:: ", event);
  const { id, code, name, length } = event.detail;
  const { ok, data } = await leaveTypeHandler.EditLeaveType(id, code, name, length);
  console.log({ ok, data });
  const EditLeaveTypeForm = document.querySelector("app-edit-leave-type-modal");
  !ok ? EditLeaveTypeForm.dispatchEvent(EditLeaveTypeErrorCustomEvent(data)) : EditLeaveTypeForm.dispatchEvent(EditLeaveTypeSuccessEvent());
})





