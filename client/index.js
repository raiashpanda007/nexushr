import "./scripts/Components/Header/Header.js";
import "./scripts/Components/Cards/Login/LoginCard.js"
import { authState } from "./scripts/Core/startup.js"
import { LoginErrorEvent, LoginMessageCustoomEvent, LogoutMessageCustomEvent } from "./scripts/events.js";

document.addEventListener("login", async (e) => {
  const { ok, data } = await authState.Login(e.detail.email, e.detail.password);
  if (!ok) {
    const LoginForm = document.querySelector("app-card-login")
    LoginForm.dispatchEvent(LoginErrorEvent(data));

  }
  const header = document.querySelector("app-header");
  header.dispatchEvent(LoginMessageCustoomEvent());
  console.log("Login response :: ", data);
  window.location.href = "http://localhost:5000/dashboard/"
})


document.addEventListener("logout", async (e) => {
  const { ok, _ } = await authState.LogOut();

  if (ok) {
    const header = document.querySelector("app-header");
    header.dispatchEvent(LogoutMessageCustomEvent());
  }


})
