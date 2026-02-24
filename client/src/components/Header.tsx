import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useHeader } from "@/hooks/Header/useHeader"
import { CalendarDays, HelpCircle, LogOut, Users } from "lucide-react"

function Header() {
    const { loggingOut, handleLogout } = useHeader();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            <div className="flex h-16 items-center justify-between px-6 lg:px-8">
                {/* Brand */}
                <div className="flex items-center gap-3 select-none hover:opacity-90 transition-opacity cursor-pointer">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/10">
                        <Users className="w-5 h-5 drop-shadow-sm" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                        NexusHR
                    </h1>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Date chip */}
                    <div className="hidden md:flex items-center gap-2 rounded-full bg-muted/50 border border-border/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                        <CalendarDays className="w-4 h-4 text-primary/70" />
                        <span>
                            {new Date().toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    </div>

                    <Separator orientation="vertical" className="!h-6 hidden md:block mx-2 bg-border/50" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:inline-flex h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all"
                        aria-label="Help"
                    >
                        <HelpCircle className="w-4.5 h-4.5" />
                    </Button>

                    <Button
                        id="logout-btn"
                        variant="ghost"
                        size="sm"
                        disabled={loggingOut}
                        onClick={handleLogout}
                        className="gap-2 h-9 px-4 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive rounded-full"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline font-medium tracking-wide">
                            {loggingOut ? "Logging out…" : "Logout"}
                        </span>
                    </Button>
                </div>
            </div>
        </header>
    )
}

export default Header