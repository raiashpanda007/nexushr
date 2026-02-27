import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { EventItem } from "@/types/events";
import { Clock, Calendar, ArrowRight } from "lucide-react";

interface EventDayDialogProps {
    isOpen: boolean;
    onClose: () => void;
    date: number | null;
    month: number;
    year: number;
    events: EventItem[];
    monthNames: string[];
}

const EVENT_TYPE_COLORS: Record<string, string> = {
    MEETING: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    BIRTHDAY: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    ANNIVERSARY: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    HOLIDAY: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

export default function EventDayDialog({
    isOpen,
    onClose,
    date,
    month,
    year,
    events,
    monthNames,
}: EventDayDialogProps) {
    const navigate = useNavigate();

    const handleEventClick = (eventId: string) => {
        onClose();
        navigate(`/events/${eventId}`);
    };

    const dateString = date
        ? `${monthNames[month - 1]} ${date}, ${year}`
        : "";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Events on {dateString}
                    </DialogTitle>
                    <DialogDescription>
                        {events.length} event{events.length !== 1 ? "s" : ""} scheduled
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
                    {events.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No events on this date
                        </p>
                    ) : (
                        events.map((event, index) => (
                            <div key={event._id}>
                                {index > 0 && <Separator className="my-2" />}
                                <div
                                    className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleEventClick(event._id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm text-foreground truncate">
                                                {event.name}
                                            </h4>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] shrink-0 ${EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.OTHER}`}
                                            >
                                                {event.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                                            {event.description}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{event.time}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
