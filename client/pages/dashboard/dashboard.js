import "../../scripts/Components/Header/Header.js"
import "../../scripts/Components/Cards/HRDashboardOptions.js"
import "../../scripts/Components/Cards/Modals/AddDepartmentForm.js"
import "../../scripts/Components/Cards/Modals/AddSkillForm.js"
import "../../scripts/Components/Cards/Modals/AddLeaveTypeForm.js"


import { permissions } from "../../scripts/Core/startup.js";
import { CreateDepartmentErrorCustomEvent, CreateDepartmentSuccessEvent } from "../../scripts/events.js"





document.addEventListener("create-dept", async (event) => {
  const { ok, data } = await permissions.CreateDept(event.detail.name, event.detail.description);
  console.log({ ok, data });
  const DeptForm = document.querySelector("app-add-dept-modal");
  !ok ? DeptForm.dispatchEvent(CreateDepartmentErrorCustomEvent(data)) : DeptForm.dispatchEvent(CreateDepartmentSuccessEvent());
})



