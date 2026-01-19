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
