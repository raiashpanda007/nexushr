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
        <aside className="w-64 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:flex flex-col shrink-0 shadow-[1px_0_10px_-2px_rgba(0,0,0,0.02)] z-10">
            {/* Role badge */}
            {role && (
                <div className="px-6 pt-5 pb-3">
                    <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 transition-colors"
                    >
                        {role}
                    </Badge>
                </div>
            )}

            <Separator className="mx-6 !w-auto bg-border/40" />

            {/* Navigation */}
            <nav className="flex flex-col gap-1.5 p-4 flex-1">
                {items.length === 0 && (
                    <div className="p-4 text-xs text-muted-foreground text-center rounded-lg bg-muted/40 border border-border/40">
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
                            className={`justify-start gap-3 h-11 px-4 font-medium transition-all duration-300 ${isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground scale-[1.02]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-[1.01]"
                                }`}
                            asChild
                        >
                            <Link to={item.path}>
                                {Icon && (
                                    <Icon
                                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive
                                                ? "text-primary-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                    />
                                )}
                                <span className={isActive ? "font-semibold tracking-wide" : ""}>{item.name}</span>
                            </Link>
                        </Button>
                    )
                })}
            </nav>
        </aside>
    )
}
