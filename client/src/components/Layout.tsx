import { Outlet } from "react-router-dom"
import Header from "./Header"
import Sidebar from "./Sidebar"

export default function Layout() {
    return (
        <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20">
            <Header />
            <div className="flex flex-1 overflow-hidden relative">
                {/* Subtle gradient background for the main content area */}
                <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/10 to-muted/20 pointer-events-none -z-10" />

                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 page-pattern">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
