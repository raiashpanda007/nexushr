
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
    className?: string;
    size?: number;
    text?: string;
    fullScreen?: boolean;
}

function Loader({ className, size = 24, text, fullScreen = false }: LoaderProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className={cn("animate-spin text-primary", className)} size={size * 1.5} />
                    {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Loader2 className="animate-spin text-primary" size={size} />
            {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
    );
}

export default Loader;