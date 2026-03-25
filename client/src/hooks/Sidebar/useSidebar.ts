import { useLocation } from "react-router-dom"
import { useAppSelector } from "@/store/hooks"

export function useSidebar() {
    const { userDetails } = useAppSelector((state) => state.userState)
    const role = userDetails?.role?.toUpperCase() // Ensure case-insensitive match if needed
    const location = useLocation()

    const hrItems = [
        { name: "Employee", path: "/employee", icon: "Users" },
        { name: "Attendance", path: "/attendance", icon: "CalendarCheck" },
        { name: "Leaves", path: "/leaves", icon: "CalendarDays" },
        { name: "Events", path: "/events", icon: "CalendarRange" },
        { name: "Departments", path: "/departments", icon: "Building2" },
        { name: "Salaries", path: "/salaries", icon: "BadgeCommon" },
        { name: "Skills", path: "/skills", icon: "Award" },
        { name: "Payroll", path: "/payroll", icon: "Banknote" },
        { name: "Assets", path: "/assets", icon: "Package" },
        { name: "Hiring", path: "/hiring", icon: "BriefcaseBusiness" },
        { name: "Reviews", path: "/reviews", icon: "ClipboardList" },
        {
            name: "Training", path: "/training", icon: "GraduationCap", children: [
                { name: "Courses", path: "/training/courses", icon: "BookOpen" },
                { name: "Analytics", path: "/training/analytics", icon: "BarChart2" },
                { name: "Assessments", path: "/training/assessments", icon: "ClipboardCheck" },
            ]
        },
    ]

    const employeeItems = [
        { name: "Attendance", path: "/attendance", icon: "CalendarCheck" },
        { name: "Leaves", path: "/leaves", icon: "CalendarDays" },
        { name: "Events", path: "/events", icon: "CalendarRange" },
        { name: "Payroll", path: "/payroll", icon: "Banknote" },
        { name: "Salaries", path: "/salaries", icon: "BadgeCommon" },
        { name: "Assets", path: "/assets", icon: "Package" },
        { name: "Reviews", path: "/reviews", icon: "ClipboardList" },
        {
            name: "Training", path: "/training", icon: "GraduationCap", children: [
                { name: "Courses", path: "/training/courses", icon: "BookOpen" },
                { name: "Analytics", path: "/training/analytics", icon: "BarChart2" },
                { name: "Assessments", path: "/training/assessments", icon: "ClipboardCheck" },
            ]
        },
    ]

    const items = role === "HR" ? hrItems : (role === "EMPLOYEE" ? employeeItems : [])

    return {
        role,
        location,
        items
    }
}
