import "./scripts/Components/Header/Header.js";
import "./scripts/Components/Cards/Login/LoginCard.js"
import { authState } from "./scripts/Core/startup.js"


document.addEventListener("login", async (e) => {
  const res = await authState.Login(e.detail.email, e.detail.password);
  console.log("Login response :: ", res);
})


document.addEventListener("logout", async (e) => {
  const res = await authState.LogOut();
  console.log("Response logout event listener :: ", res);
})
