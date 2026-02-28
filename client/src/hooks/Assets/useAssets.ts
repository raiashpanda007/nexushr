import { useState, useEffect, useCallback, useRef } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { useAppSelector } from "@/store/hooks";

export interface Asset {
    _id: string;
    name: string;
    photoURL: string;
    description: string;
    status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "DISPOSED";
    currentOwner: string;
    purchaseDate: string;
    purchasePrice: number;
    warrantyPeriod: string;
    notes: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface AssetsResponse {
    assets: Asset[];
    pagination: Pagination;
}

interface Department {
    _id: string;
    name: string;
}

interface DeptListResponse {
    data: Department[];
    total: number;
    page: number;
    limit: number;
}

interface StatsResponse {
    totalAssets: number;
    availableCount: number;
    assignedCount: number;
    maintenanceCount: number;
    disposedCount: number;
}

interface SearchUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deptId?: { _id: string; name: string };
}

export function useAssets() {
    const { userDetails } = useAppSelector((state) => state.userState);
    const role = userDetails?.role?.toUpperCase() || "";

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const limit = 10;

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [departments, setDepartments] = useState<Department[]>([]);

    // Employee search filter
    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
    const [employeeSearchResults, setEmployeeSearchResults] = useState<SearchUser[]>([]);
    const [employeeSearching, setEmployeeSearching] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<SearchUser | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Stats
    const [stats, setStats] = useState<StatsResponse | null>(null);

    // Fetch departments for HR filter dropdown (response shape: { data: [...], total, page, limit })
    useEffect(() => {
        if (role !== "HR") return;

        const fetchDepartments = async () => {
            try {
                const result = await ApiCaller<null, DeptListResponse>({
                    requestType: "GET",
                    paths: ["api", "v1", "departments"],
                    queryParams: { limit: "all" },
                });
                if (result.ok) {
                    const data = result.response.data;
                    if (data.data && Array.isArray(data.data)) {
                        setDepartments(data.data);
                    } else if (Array.isArray(data)) {
                        setDepartments(data as unknown as Department[]);
                    }
                }
            } catch {
                // silently fail
            }
        };
        fetchDepartments();
    }, [role]);

    // Fetch stats for HR
    useEffect(() => {
        if (role !== "HR") return;

        const fetchStats = async () => {
            try {
                const result = await ApiCaller<null, StatsResponse>({
                    requestType: "GET",
                    paths: ["api", "v1", "assets", "stats"],
                });
                if (result.ok) {
                    setStats(result.response.data);
                }
            } catch {
                // silently fail
            }
        };
        fetchStats();
    }, [role]);

    // Employee search
    const searchEmployees = useCallback(async (query: string) => {
        if (!query.trim() || query.trim().length < 2) {
            setEmployeeSearchResults([]);
            setEmployeeSearching(false);
            return;
        }
        setEmployeeSearching(true);
        try {
            const result = await ApiCaller<null, SearchUser[]>({
                requestType: "GET",
                paths: ["api", "v1", "search", "users"],
                queryParams: { query: query.trim() },
            });
            if (result.ok && Array.isArray(result.response.data)) {
                setEmployeeSearchResults(result.response.data);
            } else {
                setEmployeeSearchResults([]);
            }
        } catch {
            setEmployeeSearchResults([]);
        } finally {
            setEmployeeSearching(false);
        }
    }, []);

    const handleEmployeeSearchChange = (value: string) => {
        setEmployeeSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchEmployees(value), 400);
    };

    const handleSelectEmployee = (user: SearchUser) => {
        setSelectedEmployee(user);
        setEmployeeSearchOpen(false);
        setPage(1);
    };

    const handleClearEmployee = () => {
        setSelectedEmployee(null);
        setEmployeeSearchQuery("");
        setEmployeeSearchResults([]);
        setPage(1);
    };

    const fetchAssets = useCallback(async (currentPage = 1) => {
        setLoading(true);
        try {
            const queryParams: Record<string, string | number | boolean> = { page: currentPage, limit };

            if (selectedEmployee) {
                queryParams.userId = selectedEmployee._id;
            } else if (departmentFilter !== "all") {
                queryParams.departmentId = departmentFilter;
            }

            const result = await ApiCaller<null, AssetsResponse>({
                requestType: "GET",
                paths: ["api", "v1", "assets"],
                queryParams,
            });

            if (result.ok) {
                const data = result.response.data;
                let fetchedAssets: Asset[] = [];
                let fetchedTotal = 0;

                if (data && data.assets) {
                    fetchedAssets = data.assets;
                    fetchedTotal = data.pagination?.total || 0;
                } else if (Array.isArray(data)) {
                    fetchedAssets = data as unknown as Asset[];
                    fetchedTotal = fetchedAssets.length;
                }

                // Apply client-side status filter
                if (statusFilter !== "all") {
                    fetchedAssets = fetchedAssets.filter((a) => a.status === statusFilter);
                }

                setAssets(fetchedAssets);
                setTotal(statusFilter !== "all" ? fetchedAssets.length : fetchedTotal);
            } else {
                console.error("Failed to fetch assets:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching assets:", error);
        } finally {
            setLoading(false);
        }
    }, [departmentFilter, statusFilter, selectedEmployee]);

    useEffect(() => {
        fetchAssets(page);
    }, [page, fetchAssets]);

    // Reset page when filters change
    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleDepartmentFilter = (value: string) => {
        setDepartmentFilter(value);
        setPage(1);
    };

    const handleRefresh = () => {
        fetchAssets(page);
    };

    const refreshStats = useCallback(async () => {
        if (role !== "HR") return;
        try {
            const result = await ApiCaller<null, StatsResponse>({
                requestType: "GET",
                paths: ["api", "v1", "assets", "stats"],
            });
            if (result.ok) {
                setStats(result.response.data);
            }
        } catch {
            // silently fail
        }
    }, [role]);

    const handleOpenCreate = () => setIsCreateOpen(true);
    const handleCloseCreate = () => setIsCreateOpen(false);
    const handleCreateSuccess = () => {
        setIsCreateOpen(false);
        fetchAssets(page);
        refreshStats();
    };

    return {
        assets,
        loading,
        page,
        setPage,
        total,
        limit,
        role,
        isCreateOpen,
        statusFilter,
        departmentFilter,
        departments,
        stats,
        employeeSearchOpen,
        setEmployeeSearchOpen,
        employeeSearchQuery,
        employeeSearchResults,
        employeeSearching,
        selectedEmployee,
        handleEmployeeSearchChange,
        handleSelectEmployee,
        handleClearEmployee,
        handleStatusFilter,
        handleDepartmentFilter,
        handleRefresh,
        handleOpenCreate,
        handleCloseCreate,
        handleCreateSuccess,
    };
}
