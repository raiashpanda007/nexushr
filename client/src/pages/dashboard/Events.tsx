import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import EventCalendar from "@/components/events/EventCalendar";
import EventDayDialog from "@/components/events/EventDayDialog";
import CreateEventModal from "@/components/events/CreateEventModal";
import { useEvents } from "@/hooks/Events/useEvents";
import {
    CalendarRange,
    Plus,
    Loader2,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const EVENT_TYPES = [
    { value: "MEETING", label: "Meeting" },
    { value: "BIRTHDAY", label: "Birthday" },
    { value: "ANNIVERSARY", label: "Anniversary" },
    { value: "HOLIDAY", label: "Holiday" },
    { value: "OTHER", label: "Other" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export default function Events() {
    const {
        month,
        year,
        filter,
        typeFilter,
        loading,
        selectedDate,
        isDayDialogOpen,
        isCreateModalOpen,
        searchQuery,
        searchResults,
        selectedEntityName,
        isSearchOpen,
        searchLoading,
        role,
        eventsByDate,
        eventsForSelectedDate,
        monthNames,
        setMonth,
        setYear,
        setTypeFilter,
        setSearchQuery,
        setIsSearchOpen,
        handleFilterChange,
        handleSearchSelect,
        handleClearSearch,
        handleDateClick,
        handleDayDialogClose,
        handleOpenCreateModal,
        handleCreateModalClose,
        handleCreateSuccess,
    } = useEvents();

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col gap-5 z-10">
                    {/* Title row */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                                <CalendarRange className="h-7 w-7 text-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                    Events
                                </h1>
                                <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                                    Manage company events and activities
                                </p>
                            </div>
                        </div>

                        {role === "HR" && (
                            <Button
                                onClick={handleOpenCreateModal}
                                className="h-11 font-semibold gap-2 whitespace-nowrap rounded-xl px-5"
                            >
                                <Plus className="h-5 w-5" />
                                Add Event
                            </Button>
                        )}
                    </div>

                    {/* Filters row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
                        {/* Month navigation */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={handlePrevMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Select
                                value={month.toString()}
                                onValueChange={(v) => setMonth(parseInt(v))}
                            >
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthNames.map((m, i) => (
                                        <SelectItem key={i} value={(i + 1).toString()}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Year selector */}
                        <Select
                            value={year.toString()}
                            onValueChange={(v) => setYear(parseInt(v))}
                        >
                            <SelectTrigger className="w-[90px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* For filter */}
                        <Select
                            value={filter}
                            onValueChange={(v) =>
                                handleFilterChange(v as "all" | "employee" | "department")
                            }
                        >
                            <SelectTrigger className="w-[150px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                <SelectItem value="employee">By Employee</SelectItem>
                                <SelectItem value="department">By Department</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Type filter */}
                        <Select
                            value={typeFilter || "ALL_TYPES"}
                            onValueChange={(v) => setTypeFilter(v === "ALL_TYPES" ? "" : v)}
                        >
                            <SelectTrigger className="w-[130px] h-9">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL_TYPES">All Types</SelectItem>
                                {EVENT_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Search combobox (HR only, when filter is employee/department) */}
                        {role === "HR" && (filter === "employee" || filter === "department") && (
                            <div className="flex items-center gap-2">
                                {selectedEntityName ? (
                                    <Badge
                                        variant="secondary"
                                        className="h-9 px-3 gap-2 text-sm font-medium"
                                    >
                                        {selectedEntityName}
                                        <button
                                            onClick={handleClearSearch}
                                            className="hover:bg-muted rounded-full p-0.5"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </Badge>
                                ) : (
                                    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="h-9 w-[220px] justify-start gap-2 font-normal text-muted-foreground"
                                            >
                                                <Search className="h-4 w-4" />
                                                Search{" "}
                                                {filter === "employee"
                                                    ? "employee"
                                                    : "department"}
                                                ...
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-[280px] p-0"
                                            align="start"
                                        >
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder={`Search ${filter === "employee" ? "employees" : "departments"}...`}
                                                    value={searchQuery}
                                                    onValueChange={setSearchQuery}
                                                />
                                                <CommandList>
                                                    {searchLoading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <CommandEmpty>
                                                                No results found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {searchResults.map(
                                                                    (item) => (
                                                                        <CommandItem
                                                                            key={
                                                                                item._id
                                                                            }
                                                                            value={
                                                                                item._id
                                                                            }
                                                                            onSelect={() =>
                                                                                handleSearchSelect(
                                                                                    item
                                                                                )
                                                                            }
                                                                        >
                                                                            {item.name ||
                                                                                `${item.firstName || ""} ${item.lastName || ""}`.trim()}
                                                                        </CommandItem>
                                                                    )
                                                                )}
                                                            </CommandGroup>
                                                        </>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Calendar */}
            {loading ? (
                <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-base font-medium animate-pulse">
                            Loading events...
                        </p>
                    </div>
                </div>
            ) : (
                <EventCalendar
                    events={eventsByDate}
                    month={month}
                    year={year}
                    onDateClick={handleDateClick}
                />
            )}

            {/* Day Dialog */}
            <EventDayDialog
                isOpen={isDayDialogOpen}
                onClose={handleDayDialogClose}
                date={selectedDate}
                month={month}
                year={year}
                events={eventsForSelectedDate}
                monthNames={monthNames}
            />

            {/* Create Event Modal (HR only) */}
            {role === "HR" && (
                <CreateEventModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCreateModalClose}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}
