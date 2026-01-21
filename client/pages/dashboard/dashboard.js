import "../../scripts/Components/Header/Header.js"
import "../../scripts/Components/Cards/HRDashboardOptions.js"
import "../../scripts/Components/Cards/Modals/AddDepartmentForm.js"
import "../../scripts/Components/Cards/Modals/AddSkillForm.js"
import "../../scripts/Components/Cards/Modals/AddLeaveTypeForm.js"
import "../../scripts/Components/Cards/Modals/AddUserForm.js"
import "../../scripts/Components/Cards/HRDashboardCreateUser.js"

import { permissions, userHandler } from "../../scripts/Core/startup.js";
import { CreateDepartmentErrorCustomEvent, CreateDepartmentSuccessEvent, CreateSkillErrorCustomEvent, CreateSkillSuccessEvent, CreateLeaveTypeErrorCustomEvent, CreateLeaveTypeSuccessEvent, CreateUserErrorCustomEvent, CreateUserSuccessEvent } from "../../scripts/events.js"

async function main() {
  const { ok, data } = await userHandler.GetAllUser();
  console.log("All users :: ", { ok, data });
}
main();
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





