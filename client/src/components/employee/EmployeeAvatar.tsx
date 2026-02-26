import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
    className?: string;
    textClassName?: string;
}

export default function EmployeeAvatar({
    firstName,
    lastName,
    profilePhoto,
    className = "h-9 w-9",
    textClassName = "text-xs",
}: EmployeeAvatarProps) {
    const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`;

    if (profilePhoto) {
        return (
            <img
                src={profilePhoto}
                alt={`${firstName} ${lastName}`}
                className={cn("rounded-full object-cover shrink-0 shadow-sm", className)}
            />
        );
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0 shadow-sm",
                className,
                textClassName,
            )}
        >
            {initials}
        </div>
    );
}
