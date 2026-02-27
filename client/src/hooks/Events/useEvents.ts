import { useState, useEffect, useMemo } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { useAppSelector } from "@/store/hooks";
import type { EventItem } from "@/types/events";

export type EventFilter = "all" | "employee" | "department";

interface SearchEntity {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function useEvents() {
    const { userDetails } = useAppSelector((state) => state.userState);
    const role = userDetails?.role?.toUpperCase() || "";

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [events, setEvents] = useState<EventItem[]>([]);
    const [filter, setFilter] = useState<EventFilter>("all");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // Day dialog
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

    // Create modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // HR search for employee/department
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchEntity[]>([]);
    const [selectedEntityId, setSelectedEntityId] = useState<string>("");
    const [selectedEntityName, setSelectedEntityName] = useState<string>("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const queryParams: Record<string, string> = {
                month: month.toString(),
                year: year.toString(),
            };

            if (filter !== "all") {
                queryParams.for = filter;
            }

            if (typeFilter) {
                queryParams.type = typeFilter;
            }

            if (filter === "employee" && role === "HR" && selectedEntityId) {
                queryParams.empId = selectedEntityId;
            }

            if (filter === "department" && role === "HR" && selectedEntityId) {
                queryParams.deptId = selectedEntityId;
            }

            // For HR with employee/department filter but no entity selected, skip fetch
            if (role === "HR" && (filter === "employee" || filter === "department") && !selectedEntityId) {
                setEvents([]);
                setLoading(false);
                return;
            }

            const result = await ApiCaller<null, EventItem[]>({
                requestType: "GET",
                paths: ["api", "v1", "events"],
                queryParams,
            });

            if (result.ok) {
                const data = result.response.data;
                setEvents(Array.isArray(data) ? data : []);
            } else {
                console.error("Failed to fetch events:", result.response.message);
                setEvents([]);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const searchEntities = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const resource = filter === "employee" ? "users" : "departments";
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "search", resource],
                queryParams: { query: query.trim() },
            });

            if (result.ok) {
                const data = result.response.data;
                if (Array.isArray(data)) {
                    setSearchResults(data);
                } else if (data && data.data) {
                    setSearchResults(data.data);
                } else {
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Fetch events when filters change
    useEffect(() => {
        fetchEvents();
    }, [month, year, filter, typeFilter, selectedEntityId]);

    // Search debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timeoutId = setTimeout(() => {
            searchEntities(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Reset search when filter changes
    const handleFilterChange = (newFilter: EventFilter) => {
        setFilter(newFilter);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedEntityId("");
        setSelectedEntityName("");
        setIsSearchOpen(false);
    };

    const handleSearchSelect = (entity: SearchEntity) => {
        setSelectedEntityId(entity._id);
        const name = entity.name || `${entity.firstName || ""} ${entity.lastName || ""}`.trim();
        setSelectedEntityName(name);
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleClearSearch = () => {
        setSelectedEntityId("");
        setSelectedEntityName("");
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleDateClick = (day: number) => {
        setSelectedDate(day);
        setIsDayDialogOpen(true);
    };

    const handleDayDialogClose = () => {
        setIsDayDialogOpen(false);
        setSelectedDate(null);
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false);
        fetchEvents();
    };

    // Map events to dates
    const eventsByDate = useMemo(() => {
        const map: Record<number, EventItem[]> = {};
        events.forEach((event) => {
            const eventDate = new Date(event.date);
            if (eventDate.getMonth() + 1 === month && eventDate.getFullYear() === year) {
                const day = eventDate.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(event);
            }
        });
        return map;
    }, [events, month, year]);

    // Events for selected date
    const eventsForSelectedDate = useMemo(() => {
        if (selectedDate === null) return [];
        return eventsByDate[selectedDate] || [];
    }, [eventsByDate, selectedDate]);

    return {
        // State
        month,
        year,
        events,
        filter,
        typeFilter,
        loading,
        selectedDate,
        isDayDialogOpen,
        isCreateModalOpen,
        searchQuery,
        searchResults,
        selectedEntityId,
        selectedEntityName,
        isSearchOpen,
        searchLoading,
        role,
        eventsByDate,
        eventsForSelectedDate,
        monthNames: MONTHS,

        // Actions
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
    };
}
