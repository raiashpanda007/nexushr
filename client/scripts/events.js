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
    composed: true
  })
}

export function LoginErrorEvent(err) {
  return new CustomEvent("login-error", {
    detail: {
      error: err
    },
    bubbles: true,
    composed: true
  })
}


export function LogoutMessageCustomEvent() {
  return new CustomEvent("logout-message", { bubbles: true, composed: true });
}


export function LoginMessageCustoomEvent() {
  return new CustomEvent("login-message", { bubbles: true, composed: true })
}


export function AddDepartmentCustomEvent() {
  return new CustomEvent("add-department-modal", { bubbles: true, composed: true });
}

export function AddSkillCustomEvent() {
  return new CustomEvent("add-skill-modal", { bubbles: true, composed: true });
}

export function AddLeaveTypeCustomEvent() {
  return new CustomEvent("add-leave-type-modal", { bubbles: true, composed: true });
}



export function CreateDepartmentCustomEvent(name, description) {
  return new CustomEvent("create-dept", {
    detail: {
      name,
      description
    },
    bubbles: true,
    composed: true
  })
}

export function CreateDepartmentErrorCustomEvent(err) {
  return new CustomEvent("create-dept-err", {
    detail: {
      error: err
    },
    bubbles: true,
    composed: true

  })
}

export function CreateDepartmentSuccessEvent() {
  return new CustomEvent("create-dept-success", {
    bubbles: true,
    composed: true
  })
}

export function CreateSkillCustomEvent(name, description) {
  return new CustomEvent("create-skill", {
    detail: {
      name,
      description
    },
    bubbles: true,
    composed: true
  })
}

export function CreateSkillErrorCustomEvent(err) {
  return new CustomEvent("create-skill-err", {
    detail: {
      error: err
    },
    bubbles: true,
    composed: true
  })
}

export function CreateSkillSuccessEvent() {
  return new CustomEvent("create-skill-success", {
    bubbles: true,
    composed: true
  })
}

export function CreateLeaveTypeCustomEvent(name, code, length) {
  return new CustomEvent("create-leave-type", {
    detail: {
      name,
      code,
      length
    },
    bubbles: true,
    composed: true
  })
}

export function CreateLeaveTypeErrorCustomEvent(err) {
  return new CustomEvent("create-leave-type-err", {
    detail: {
      error: err
    },
    bubbles: true,
    composed: true
  })
}

export function CreateLeaveTypeSuccessEvent() {
  return new CustomEvent("create-leave-type-success", {
    bubbles: true,
    composed: true
  })
}

export function AddUserCustomEvent() {
  return new CustomEvent("add-user-modal", { bubbles: true, composed: true });
}

export function CreateUserCustomEvent(email, firstName, lastName, password, note, skills, department) {
  return new CustomEvent("create-user", {
    detail: {
      email,
      firstName,
      lastName,
      password,
      note,
      skills,
      department
    },
    bubbles: true,
    composed: true
  })
}

export function CreateUserErrorCustomEvent(err) {
  return new CustomEvent("create-user-err", {
    detail: {
      error: err
    },
    bubbles: true,
    composed: true
  })
}

export function CreateUserSuccessEvent() {
  return new CustomEvent("create-user-success", {
    bubbles: true,
    composed: true
  })
}

export function EditUserCustomEvent(id, email, firstName, lastName, password, profilePhoto, note, skills, department) {
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
      department
    },
    bubbles: true,
    composed: true
  })
}

export function EditUserErrorCustomEvent(err) {
  return new CustomEvent("edit-user-err", {
    detail: {
      error: err
    },
    bubbles: true,
    composed: true
  })
}

export function EditUserSuccessEvent() {
  return new CustomEvent("edit-user-success", {
    bubbles: true,
    composed: true
  })
}

export function OpenEditUserModalEvent(user) {
  return new CustomEvent("edit-user-modal", {
    detail: {
      user
    },
    bubbles: true,
    composed: true
  });
}
