import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Layout from "./components/Layout"
import { useAppSelector } from "./store/hooks"
import Employee from "./pages/dashboard/Employee"
import Departments from "./pages/dashboard/Departments"
import Salaries from "./pages/dashboard/Salaries"
import Skills from "./pages/dashboard/Skills"
import Payroll from "./pages/dashboard/Payroll"
import Attendance from "./pages/dashboard/Attendance"
import Leaves from "./pages/dashboard/Leaves"
import Events from "./pages/dashboard/Events"
import EventDetails from "./pages/dashboard/EventDetails"
import EmployeeDetails from "./pages/dashboard/EmployeeDetails"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userDetails } = useAppSelector((state) => state.userState)
  if (!userDetails) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RoleBasedRedirect() {
  const { userDetails } = useAppSelector((state) => state.userState)
  if (!userDetails) return <Navigate to="/login" replace />

  // Ensure role check is case-insensitive or consistent with backend
  const role = userDetails.role ? userDetails.role.toUpperCase() : ""

  if (role === "HR") return <Navigate to="/employee" replace />
  if (role === "EMPLOYEE") return <Navigate to="/attendance" replace />

  return <div className="p-4">Role "{role}" not recognized or has no default page.</div>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleBasedRedirect />} />
        <Route path="employee" element={<Employee />} />
        <Route path="employee/:id" element={<EmployeeDetails />} />
        <Route path="departments" element={<Departments />} />
        <Route path="salaries" element={<Salaries />} />
        <Route path="skills" element={<Skills />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetails />} />
      </Route>

      {/* Catch all - redirect to home (which redirects based on role) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App