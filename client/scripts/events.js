export function LoginCustomEvent(email, password) {
  return new CustomEvent("login", {
    detail: {
      email,
      password,
    },
    bubbles: true,
    composed: true,
  });
}

export function LogoutCustomEvent() {
  return new CustomEvent("logout", {
    bubbles: true,
    composed: true,
  });
}

export function LoginErrorEvent(err) {
  return new CustomEvent("login-error", {
    detail: {
      error: err,
    },
    bubbles: true,
    composed: true,
  });
}

export function LogoutMessageCustomEvent() {
  return new CustomEvent("logout-message", { bubbles: true, composed: true });
}

export function LoginMessageCustoomEvent() {
  return new CustomEvent("login-message", { bubbles: true, composed: true });
}
export function LoginSuccess() {
  return new CustomEvent("login-success", {
    bubbles: true,
    composed: true,
  });
}

export function AddDepartmentCustomEvent() {
  return new CustomEvent("add-department-modal", {
    bubbles: true,
    composed: true,
  });
}

export function AddSkillCustomEvent() {
  return new CustomEvent("add-skill-modal", { bubbles: true, composed: true });
}

export function AddLeaveTypeCustomEvent() {
  return new CustomEvent("add-leave-type-modal", {
    bubbles: true,
    composed: true,
  });
}

export function CreateDepartmentCustomEvent(name, description) {
  return new CustomEvent("create-dept", {
    detail: {
      name,
      description,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateDepartmentErrorCustomEvent(err) {
  return new CustomEvent("create-dept-err", {
    detail: {
      error: err,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateDepartmentSuccessEvent() {
  return new CustomEvent("create-dept-success", {
    bubbles: true,
    composed: true,
  });
}

export function CreateSkillCustomEvent(name, description) {
  return new CustomEvent("create-skill", {
    detail: {
      name,
      description,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateSkillErrorCustomEvent(err) {
  return new CustomEvent("create-skill-err", {
    detail: {
      error: err,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateSkillSuccessEvent() {
  return new CustomEvent("create-skill-success", {
    bubbles: true,
    composed: true,
  });
}

export function CreateLeaveTypeCustomEvent(name, code, length) {
  return new CustomEvent("create-leave-type", {
    detail: {
      name,
      code,
      length,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateLeaveTypeErrorCustomEvent(err) {
  return new CustomEvent("create-leave-type-err", {
    detail: {
      error: err,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateLeaveTypeSuccessEvent() {
  return new CustomEvent("create-leave-type-success", {
    bubbles: true,
    composed: true,
  });
}

export function AddUserCustomEvent() {
  return new CustomEvent("add-user-modal", { bubbles: true, composed: true });
}

export function CreateUserCustomEvent(
  email,
  firstName,
  lastName,
  password,
  profilePhoto,
  note,
  skills,
  department,
) {
  return new CustomEvent("create-user", {
    detail: {
      email,
      firstName,
      lastName,
      password,
      profilePhoto,
      note,
      skills,
      department,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateUserErrorCustomEvent(err) {
  return new CustomEvent("create-user-err", {
    detail: {
      error: err,
    },
    bubbles: true,
    composed: true,
  });
}

export function CreateUserSuccessEvent() {
  return new CustomEvent("create-user-success", {
    bubbles: true,
    composed: true,
  });
}

export function EditUserCustomEvent(
  id,
  email,
  firstName,
  lastName,
  password,
  profilePhoto,
  note,
  skills,
  department,
) {
  return new CustomEvent("edit-user", {
    detail: {
      id,
      email,
      firstName,
      lastName,
      password,
      profilePhoto,
      note,
      skills,
      department,
    },
    bubbles: true,
    composed: true,
  });
}

export function EditUserErrorCustomEvent(err) {
  return new CustomEvent("edit-user-err", {
    detail: {
      error: err,
    },
    bubbles: true,
    composed: true,
  });
}

export function EditUserSuccessEvent() {
  return new CustomEvent("edit-user-success", {
    bubbles: true,
    composed: true,
  });
}

export function OpenEditUserModalEvent(user) {
  return new CustomEvent("edit-user-modal", {
    detail: {
      user,
    },
    bubbles: true,
    composed: true,
  });
}
export function OpenEditDepartmentModalEvent(dept) {
  return new CustomEvent("open-edit-dept-modal", {
    detail: { dept },
    bubbles: true,
    composed: true,
  });
}

export function EditDepartmentCustomEvent(id, name, description) {
  return new CustomEvent("edit-dept", {
    detail: { id, name, description },
    bubbles: true,
    composed: true,
  });
}

export function EditDepartmentSuccessEvent() {
  return new CustomEvent("edit-dept-success", {
    bubbles: true,
    composed: true,
  });
}

export function EditDepartmentErrorCustomEvent(err) {
  return new CustomEvent("edit-dept-err", {
    detail: { error: err },
    bubbles: true,
    composed: true,
  });
}
export function OpenEditSkillModalEvent(skill) {
  return new CustomEvent("open-edit-skill-modal", {
    detail: { skill },
    bubbles: true,
    composed: true,
  });
}

export function EditSkillCustomEvent(id, name, category) {
  return new CustomEvent("edit-skill", {
    detail: { id, name, category },
    bubbles: true,
    composed: true,
  });
}

export function EditSkillSuccessEvent() {
  return new CustomEvent("edit-skill-success", {
    bubbles: true,
    composed: true,
  });
}

export function EditSkillErrorCustomEvent(err) {
  return new CustomEvent("edit-skill-err", {
    detail: { error: err },
    bubbles: true,
    composed: true,
  });
}
export function OpenEditLeaveTypeModalEvent(leaveType) {
  return new CustomEvent("open-edit-leave-type-modal", {
    detail: { leaveType },
    bubbles: true,
    composed: true,
  });
}

export function EditLeaveTypeCustomEvent(id, code, name, length) {
  return new CustomEvent("edit-leave-type", {
    detail: { id, code, name, length },
    bubbles: true,
    composed: true,
  });
}

export function EditLeaveTypeSuccessEvent() {
  return new CustomEvent("edit-leave-type-success", {
    bubbles: true,
    composed: true,
  });
}

export function EditLeaveTypeErrorCustomEvent(err) {
  return new CustomEvent("edit-leave-type-err", {
    detail: { error: err },
    bubbles: true,
    composed: true,
  });
}

export function OpenAddSalaryModalEvent(user) {
  return new CustomEvent("open-add-salary-modal", {
    detail: user,
    bubbles: true,
    composed: true,
  });
}

export function CreateSalaryCustomEvent(data) {
  return new CustomEvent("create-salary", {
    detail: data,
    bubbles: true,
    composed: true,
  });
}

export function CreateSalarySuccessEvent() {
  return new CustomEvent("create-salary-success", {
    bubbles: true,
    composed: true,
  });
}

export function CreateSalaryErrorCustomEvent(error) {
  return new CustomEvent("create-salary-error", {
    detail: { error },
    bubbles: true,
    composed: true,
  });
}

export function OpenEditSalaryModalEvent(salary) {
  return new CustomEvent("open-edit-salary-modal", {
    detail: salary,
    bubbles: true,
    composed: true,
  });
}

export function EditSalaryCustomEvent(data) {
  return new CustomEvent("edit-salary", {
    detail: data,
    bubbles: true,
    composed: true,
  });
}

export function EditSalarySuccessEvent() {
  return new CustomEvent("edit-salary-success", {
    bubbles: true,
    composed: true,
  });
}

export function EditSalaryErrorCustomEvent(error) {
  return new CustomEvent("edit-salary-error", {
    detail: { error },
    bubbles: true,
    composed: true,
  });
}

export function OpenGeneratePayrollModalEvent(user) {
  return new CustomEvent("open-generate-payroll-modal", {
    detail: user,
    bubbles: true,
    composed: true,
  });
}

export function CreatePayrollCustomEvent(data) {
  return new CustomEvent("create-payroll", {
    detail: data,
    bubbles: true,
    composed: true,
  });
}

export function CreatePayrollSuccessEvent() {
  return new CustomEvent("create-payroll-success", {
    bubbles: true,
    composed: true,
  });
}

export function CreatePayrollErrorCustomEvent(error) {
  return new CustomEvent("create-payroll-error", {
    detail: { error },
    bubbles: true,
    composed: true,
  });
}
export function SPS(state) {
  return new CustomEvent("sps", {
    detail: { state },
    bubbles: true,
    composed: true,
  });
}

export function WSConnectedEvent() {
  return new CustomEvent("ws-connected", {
    bubbles: true,
    composed: true,
  });
}

export function WSDisconnectedEvent() {
  return new CustomEvent("ws-disconnected", {
    bubbles: true,
    composed: true,
  });
}

export function NetworkStatusChange(isOnline) {
  return new CustomEvent("network-status-changed", {
    detail: { isOnline },
    bubbles: true,
    composed: true,
  });
}

export function QueueFlushedEvent() {
  return new CustomEvent("queue-flushed", {
    bubbles: true,
    composed: true,
  });
}


export function LongPollingEvent(state) {
  return new CustomEvent("long-polling-event", {
    detail:{
      state
    },
    bubbles: true,
    composed: true,
  });
}
