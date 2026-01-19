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
