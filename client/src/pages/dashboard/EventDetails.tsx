import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCaller from "@/utils/ApiCaller";
import type { EventItem } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Users,
    Building2,
    Globe,
    Loader2,
    Tag,
} from "lucide-react";

const EVENT_TYPE_COLORS: Record<string, string> = {
    MEETING: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    BIRTHDAY: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    ANNIVERSARY: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    HOLIDAY: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await ApiCaller<null, EventItem>({
                    requestType: "GET",
                    paths: ["api", "v1", "events", id],
                });

                if (result.ok) {
                    setEvent(result.response.data);
                } else {
                    setError(result.response.message || "Event not found");
                }
            } catch {
                setError("Failed to fetch event details");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-base font-medium text-muted-foreground animate-pulse">
                    Loading event details...
                </p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
                <p className="text-lg font-medium text-muted-foreground">
                    {error || "Event not found"}
                </p>
                <Button variant="outline" onClick={() => navigate("/events")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Events
                </Button>
            </div>
        );
    }

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Back button */}
            <Button
                variant="ghost"
                className="w-fit gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/events")}
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Events
            </Button>

            {/* Event Header */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            {event.name}
                        </h1>
                        <Badge
                            variant="secondary"
                            className={`text-sm shrink-0 ${EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.OTHER}`}
                        >
                            {event.type}
                        </Badge>
                    </div>

                    <p className="text-muted-foreground text-base leading-relaxed mb-6">
                        {event.description}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>{event.type}</span>
                        </div>
                        {event.forAll && (
                            <div className="flex items-center gap-2 text-sm text-foreground">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>Company-wide event</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employees */}
                {event.employeeDetails && event.employeeDetails.length > 0 && (
                    <Card className="rounded-2xl border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                Employees
                                <Badge variant="secondary" className="ml-auto">
                                    {event.employeeDetails.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {event.employeeDetails.map((emp) => (
                                    <div
                                        key={emp._id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                            {emp.firstName?.[0]}
                                            {emp.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {emp.firstName} {emp.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {emp.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Departments */}
                {event.departmentDetails && event.departmentDetails.length > 0 && (
                    <Card className="rounded-2xl border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                Departments
                                <Badge variant="secondary" className="ml-auto">
                                    {event.departmentDetails.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {event.departmentDetails.map((dept) => (
                                    <div
                                        key={dept._id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            {dept.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Metadata */}
            {(event.createdAt || event.updatedAt) && (
                <div className="text-xs text-muted-foreground flex gap-4">
                    {event.createdAt && (
                        <span>
                            Created:{" "}
                            {new Date(event.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                    {event.updatedAt && (
                        <span>
                            Updated:{" "}
                            {new Date(event.updatedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
