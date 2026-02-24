import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useHeader } from "@/hooks/Header/useHeader"
import { CalendarDays, HelpCircle, LogOut, Users } from "lucide-react"

function Header() {
    const { loggingOut, handleLogout } = useHeader();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
                {/* Brand */}
                <div className="flex items-center gap-2.5 select-none">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <Users className="w-4 h-4" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        NexusHR
                    </h1>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Date chip */}
                    <div className="hidden md:flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>
                            {new Date().toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    </div>

                    <Separator orientation="vertical" className="!h-5 hidden md:block mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Help"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </Button>

                    <Button
                        id="logout-btn"
                        variant="ghost"
                        size="sm"
                        disabled={loggingOut}
                        onClick={handleLogout}
                        className="gap-1.5 h-8 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            {loggingOut ? "Logging out…" : "Logout"}
                        </span>
                    </Button>
                </div>
            </div>
        </header>
    )
}

export default Header