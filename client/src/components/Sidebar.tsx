import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/hooks/Sidebar/useSidebar"
import {
    Users,
    CalendarCheck,
    CalendarDays,
    Building2,
    BadgeDollarSign,
    Award,
    Banknote,
    type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
    Users,
    CalendarCheck,
    CalendarDays,
    Building2,
    BadgeCommon: BadgeDollarSign,
    Award,
    Banknote,
}

export default function Sidebar() {
    const { role, location, items } = useSidebar()

    return (
        <aside className="w-60 border-r bg-muted/10 hidden md:flex flex-col shrink-0">
            {/* Role badge */}
            {role && (
                <div className="px-4 pt-4 pb-2">
                    <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider font-medium"
                    >
                        {role}
                    </Badge>
                </div>
            )}

            <Separator className="mx-4 !w-auto" />

            {/* Navigation */}
            <nav className="flex flex-col gap-0.5 p-3 flex-1">
                {items.length === 0 && (
                    <div className="p-4 text-xs text-muted-foreground text-center rounded-md bg-muted/40">
                        No menu items for role: {role || "Guest"}
                    </div>
                )}
                {items.map((item) => {
                    const isActive = location.pathname.startsWith(item.path)
                    const Icon = iconMap[item.icon]
                    return (
                        <Button
                            key={item.path}
                            variant="ghost"
                            size="sm"
                            className={`justify-start gap-2.5 h-9 px-3 font-normal transition-colors ${
                                isActive
                                    ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            asChild
                        >
                            <Link to={item.path}>
                                {Icon && (
                                    <Icon
                                        className={`w-4 h-4 shrink-0 ${
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                        }`}
                                    />
                                )}
                                {item.name}
                            </Link>
                        </Button>
                    )
                })}
            </nav>
        </aside>
    )
}
