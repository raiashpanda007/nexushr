import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { EventItem } from "@/types/events";

interface EventCalendarProps {
    events: Record<number, EventItem[]>;
    month: number;
    year: number;
    onDateClick: (day: number) => void;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_COLORS: Record<string, string> = {
    MEETING: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    BIRTHDAY: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    ANNIVERSARY: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    HOLIDAY: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

export default function EventCalendar({ events, month, year, onDateClick }: EventCalendarProps) {
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    const todayDate = today.getDate();

    const calendarCells = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

        const cells: (number | null)[] = [];

        // Empty cells before first day
        for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push(null);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(day);
        }

        // Fill remaining cells to complete last row
        const remainder = cells.length % 7;
        if (remainder > 0) {
            for (let i = 0; i < 7 - remainder; i++) {
                cells.push(null);
            }
        }

        return cells;
    }, [month, year]);

    return (
        <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border/40">
                {DAY_HEADERS.map((day) => (
                    <div
                        key={day}
                        className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {calendarCells.map((day, index) => {
                    const dayEvents = day ? events[day] || [] : [];
                    const isToday = isCurrentMonth && day === todayDate;
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={index}
                            className={`min-h-[100px] border-b border-r border-border/20 p-1.5 transition-colors ${day
                                ? "cursor-pointer hover:bg-muted/40"
                                : "bg-muted/10"
                                } ${isToday ? "bg-primary/5" : ""}`}
                            onClick={() => day && onDateClick(day)}
                        >
                            {day && (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday
                                                ? "bg-primary text-primary-foreground"
                                                : "text-foreground"
                                                }`}
                                        >
                                            {day}
                                        </span>
                                        {hasEvents && (
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5 overflow-y-auto max-h-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {dayEvents.map((event) => (
                                            <Badge
                                                key={event._id}
                                                variant="secondary"
                                                className={`block w-full truncate text-[10px] px-1.5 py-0 h-5 font-medium leading-5 ${EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.OTHER}`}
                                            >
                                                {event.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
