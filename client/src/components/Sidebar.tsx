import { Link, useLocation } from "react-router-dom"
import { useAppSelector } from "@/store/hooks"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
    const { userDetails } = useAppSelector((state) => state.userState)
    const role = userDetails?.role?.toUpperCase() // Ensure case-insensitive match if needed
    const location = useLocation()

    const hrItems = [
        { name: "Employee", path: "/employee", icon: "Users" },
        { name: "Departments", path: "/departments", icon: "Building2" },
        { name: "Salaries", path: "/salaries", icon: "BadgeCommon" },
        { name: "Skills", path: "/skills", icon: "Award" },
        { name: "Payroll", path: "/payroll", icon: "Banknote" },
    ]

    const employeeItems = [
        { name: "Attendance", path: "/attendance", icon: "CalendarCheck" },
        { name: "Leaves", path: "/leaves", icon: "CalendarDays" },
        { name: "Payroll", path: "/payroll", icon: "Banknote" },
        { name: "Salaries", path: "/salaries", icon: "BadgeCommon" },
    ]

    const items = role === "HR" ? hrItems : (role === "EMPLOYEE" ? employeeItems : [])

    return (
        <aside className="w-64 border-r bg-muted/10 hidden md:block shrink-0">
            <div className="flex flex-col gap-2 p-4">
                {items.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        No menu items for role: {role || 'Guest'}
                    </div>
                )}
                {items.map((item) => {
                    const isActive = location.pathname.startsWith(item.path)
                    return (
                        <Button
                            key={item.path}
                            variant={isActive ? "secondary" : "ghost"}
                            className={`justify-start gap-2 ${isActive ? "font-semibold" : ""}`}
                            asChild
                        >
                            <Link to={item.path}>
                                {/* minimal icon placeholder since we don't know if lucide-react icons are all available by name easily without dynamic import map, but project has lucide-react */}
                                {item.name}
                            </Link>
                        </Button>
                    )
                })}
            </div>
        </aside>
    )
}
