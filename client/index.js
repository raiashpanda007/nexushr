import "./scripts/Components/Header/Header.js";
import "./scripts/Components/Cards/Login/LoginCard.js"
import { authState, attendanceHandler } from "./scripts/Core/startup.js"
import { LoginErrorEvent, LoginMessageCustoomEvent, LoginSuccess, LogoutMessageCustomEvent } from "./scripts/events.js";

document.addEventListener("login", async (e) => {
  const { ok, data } = await authState.Login(e.detail.email, e.detail.password);
  const LoginForm = document.querySelector("app-card-login")
  if (!ok) {
    
    LoginForm.dispatchEvent(LoginErrorEvent(data));
    return;
  }


  const header = document.querySelector("app-header");
  header.dispatchEvent(LoginMessageCustoomEvent());
  LoginForm.dispatchEvent(LoginSuccess());
  console.log("Login response :: ", data);
  window.location.href = "/dashboard/"
})


document.addEventListener("logout", async (e) => {
  const { ok, _ } = await authState.LogOut();

  if (ok) {
    const header = document.querySelector("app-header");
    header.dispatchEvent(LogoutMessageCustomEvent());
  }


})
