import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import type { LeaveRequest } from "@/components/leaves/LeaveRequestsTable";

interface RawLeaveBalanceDoc {
    _id: string;
    user: string;
    userDetails?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePhoto?: string;
        department?: { name: string }
    };
    leaves: Array<{
        type: string;
        amount: number;
        typeDetails?: { _id: string; name: string };
    }>;
}

function mapRawToUserLeaveBalance(doc: RawLeaveBalanceDoc): UserLeaveBalance {
    return {
        balanceId: doc._id,
        userId: doc.userDetails?._id ?? doc.user,
        firstName: doc.userDetails?.firstName ?? "",
        lastName: doc.userDetails?.lastName ?? "",
        email: doc.userDetails?.email ?? "",
        profilePhoto: doc.userDetails?.profilePhoto,
        department: doc.userDetails?.department?.name ?? "",
        balances: (doc.leaves ?? []).map((l) => ({
            leaveTypeId: l.typeDetails?._id ?? String(l.type),
            leaveTypeName: l.typeDetails?.name ?? "Unknown",
            balance: l.amount,
        })),
    };
}

export type LeaveTab = "types" | "balances" | "requests";

type LeaveRequestStatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

interface DepartmentLeaveSummary {
    departmentId: string;
    department: string;
    totalLeaves: number;
    leaveTypes?: Array<{ type: string; count: number }>;
}

interface DepartmentUserSummary {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalLeaves: number;
    leaveTypes?: Array<{ type: string; count: number }>;
}

interface LeaveRequestCounts {
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
}

interface LeaveTypeSummary {
    type: string;
    count: number;
}

export function useLeaves() {
    const { userDetails } = useAppSelector((state) => state.userState);
    const role = userDetails?.role?.toUpperCase();

    const [activeTab, setActiveTab] = useState<LeaveTab>("types");
    const [search, setSearch] = useState("");

    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
    const [leaveTypesPage, setLeaveTypesPage] = useState(1);
    const [leaveTypesTotal, setLeaveTypesTotal] = useState(0);

    const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
    const [isLeaveTypeModalOpen, setIsLeaveTypeModalOpen] = useState(false);

    const [userBalances, setUserBalances] = useState<UserLeaveBalance[]>([]);
    const [balancesLoading, setBalancesLoading] = useState(false);
    const [balancesPage, setBalancesPage] = useState(1);
    const [balancesTotal, setBalancesTotal] = useState(0);

    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsTotal, setRequestsTotal] = useState(0);
    const requestsLimit = 10;

    const [leaveRequestCounts, setLeaveRequestCounts] = useState<LeaveRequestCounts>({
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
    });

    const [departmentStatusFilter, setDepartmentStatusFilter] = useState<LeaveRequestStatusFilter>("ALL");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
    const [departmentStatsLoading, setDepartmentStatsLoading] = useState(false);
    const [departmentStats, setDepartmentStats] = useState<DepartmentLeaveSummary[]>([]);
    const [departmentUsersLoading, setDepartmentUsersLoading] = useState(false);
    const [departmentUsers, setDepartmentUsers] = useState<DepartmentUserSummary[]>([]);
    const [departmentLeaveTypes, setDepartmentLeaveTypes] = useState<LeaveTypeSummary[]>([]);

    const fetchLeaveRequestCounts = async () => {
        try {
            if (!navigator.onLine) return;

            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "requests", "count"],
            });

            if (result.ok) {
                const data = result.response.data;
                setLeaveRequestCounts({
                    pendingCount: data?.pendingCount ?? 0,
                    acceptedCount: data?.acceptedCount ?? 0,
                    rejectedCount: data?.rejectedCount ?? 0,
                });
            } else {
                console.error("Failed to fetch leave request counts:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching leave request counts:", error);
        }
    };

    const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserLeaveBalance | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchLeaveRequests = async (currentPage = 1) => {
        setRequestsLoading(true);
        try {
            let apiRequests: LeaveRequest[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "leaves", "requests"],
                    queryParams: { page: currentPage.toString(), limit: requestsLimit.toString() }
                });

                if (result.ok) {
                    if (Array.isArray(result.response.data)) {
                        apiRequests = result.response.data;
                    } else if (result.response.data?.data) {
                        apiRequests = result.response.data.data;
                        apiTotal = result.response.data.total || 0;
                    }
                } else {
                    console.error("Failed to fetch leave requests:", result.response.message);
                }
            }

            setLeaveRequests(apiRequests);
            setRequestsTotal(apiTotal);

            // Keep summary cards accurate (counts are not page-limited)
            await fetchLeaveRequestCounts();
        } catch (error) {
            console.error("Error fetching leave requests:", error);
        } finally {
            setRequestsLoading(false);
        }
    };

    const fetchDepartmentStats = async () => {
        if (role !== "HR") return;
        if (!navigator.onLine) return;

        setDepartmentStatsLoading(true);
        try {
            const queryParams: Record<string, string> = {};
            if (departmentStatusFilter !== "ALL") {
                queryParams.status = departmentStatusFilter;
            }

            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "requests", "department"],
                queryParams,
            });

            if (result.ok) {
                const data = Array.isArray(result.response.data) ? result.response.data : [];
                setDepartmentStats(
                    data.map((d: any) => ({
                        departmentId: String(d.departmentId ?? ""),
                        department: String(d.department ?? ""),
                        totalLeaves: Number(d.totalLeaves ?? 0),
                        leaveTypes: Array.isArray(d.leaveTypes) ? d.leaveTypes : [],
                    }))
                );
            } else {
                console.error("Failed to fetch department stats:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching department stats:", error);
        } finally {
            setDepartmentStatsLoading(false);
        }
    };

    const fetchDepartmentUsers = async (departmentId: string) => {
        if (role !== "HR") return;
        if (!navigator.onLine) return;
        if (!departmentId || departmentId === "all") {
            setDepartmentUsers([]);
            setDepartmentLeaveTypes([]);
            return;
        }

        setDepartmentUsersLoading(true);
        try {
            const queryParams: Record<string, string> = {};
            if (departmentStatusFilter !== "ALL") {
                queryParams.status = departmentStatusFilter;
            }

            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "requests", "department", departmentId],
                queryParams,
            });

            if (result.ok) {
                const data = result.response.data;
                const userSummary = Array.isArray(data?.userSummary) ? data.userSummary : [];
                const typeSummary = Array.isArray(data?.leaveTypeSummary) ? data.leaveTypeSummary : [];

                setDepartmentUsers(
                    userSummary.map((u: any) => ({
                        userId: String(u.userId ?? ""),
                        firstName: String(u.firstName ?? ""),
                        lastName: String(u.lastName ?? ""),
                        email: String(u.email ?? ""),
                        totalLeaves: Number(u.totalLeaves ?? 0),
                        leaveTypes: Array.isArray(u.leaveTypes) ? u.leaveTypes : [],
                    }))
                );

                setDepartmentLeaveTypes(
                    typeSummary.map((t: any) => ({
                        type: String(t.type ?? ""),
                        count: Number(t.count ?? 0)
                    }))
                );
            } else {
                console.error("Failed to fetch department users:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching department users:", error);
        } finally {
            setDepartmentUsersLoading(false);
        }
    };

    const fetchLeaveTypes = async (currentPage = 1) => {
        setLeaveTypesLoading(true);
        try {
            let apiTypes: LeaveType[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "leaves", "types"],
                    queryParams: { page: currentPage.toString(), limit: "10" }
                });

                if (result.ok) {
                    if (Array.isArray(result.response.data)) {
                        apiTypes = result.response.data;
                    } else if (result.response.data?.data) {
                        apiTypes = result.response.data.data;
                        apiTotal = result.response.data.total || 0;
                    }
                }
            }

            setLeaveTypes(apiTypes);
            setLeaveTypesTotal(apiTotal);
        } catch (error) {
            console.error("Error fetching leave types:", error);
        } finally {
            setLeaveTypesLoading(false);
        }
    };

    const fetchUserBalances = async (currentPage = 1) => {
        setBalancesLoading(true);
        try {
            let apiBalances: UserLeaveBalance[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "leaves", "balances"],
                    queryParams: { page: currentPage.toString(), limit: "10" }
                });

                if (result.ok) {
                    const data = result.response.data;
                    const raw = Array.isArray(data) ? data : (data?.data || []);
                    apiBalances = raw.map(mapRawToUserLeaveBalance);
                    apiTotal = data?.total || 0;
                }
            }

            setUserBalances(apiBalances);
            setBalancesTotal(apiTotal);
        } catch (error) {
            console.error("Error fetching leave balances:", error);
        } finally {
            setBalancesLoading(false);
        }
    };

    useEffect(() => {
        if (role === "HR" && activeTab === "types") {
            fetchLeaveTypes(leaveTypesPage);
        }
    }, [role, leaveTypesPage, activeTab]);

    useEffect(() => {
        if (role === "HR" && activeTab === "balances") {
            fetchUserBalances(balancesPage);
        }
    }, [role, balancesPage, activeTab]);

    useEffect(() => {
        if (role === "HR" && activeTab === "requests") {
            fetchLeaveRequests(requestsPage);
        }
    }, [role, requestsPage, activeTab]);

    useEffect(() => {
        if (role === "HR" && activeTab === "requests") {
            fetchDepartmentStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, activeTab, departmentStatusFilter]);

    useEffect(() => {
        if (role === "HR" && activeTab === "requests") {
            fetchDepartmentUsers(selectedDepartmentId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, activeTab, selectedDepartmentId, departmentStatusFilter]);

    const handleAddLeaveType = () => {
        setSelectedLeaveType(null);
        setIsLeaveTypeModalOpen(true);
    };

    const handleEditLeaveType = (leaveType: LeaveType) => {
        setSelectedLeaveType(leaveType);
        setIsLeaveTypeModalOpen(true);
    };

    const handleLeaveTypeModalClose = () => {
        setIsLeaveTypeModalOpen(false);
        setSelectedLeaveType(null);
    };

    const handleLeaveTypeSuccess = () => {
        if (!selectedLeaveType) {
            // New leave type created — go to page 1 so it appears at the top
            if (leaveTypesPage !== 1) {
                setLeaveTypesPage(1); // useEffect will trigger fetch for page 1
            } else {
                fetchLeaveTypes(1);
            }
        } else {
            // Existing leave type edited — refresh current page
            fetchLeaveTypes(leaveTypesPage);
        }
    };

    const handleCreateBalanceSuccess = () => {
        // New balance created — go to page 1 so it appears at the top
        if (balancesPage !== 1) {
            setBalancesPage(1); // useEffect will trigger fetch for page 1
        } else {
            fetchUserBalances(1);
        }
    };

    const handleEditBalanceSuccess = () => {
        fetchUserBalances(balancesPage);
    };

    const filteredLeaveTypes = useMemo(() => {
        if (!search.trim()) return leaveTypes;
        const q = search.toLowerCase();
        return leaveTypes.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                (t.code && t.code.toLowerCase().includes(q))
        );
    }, [leaveTypes, search]);

    const filteredUserBalances = useMemo(() => {
        if (!search.trim()) return userBalances;
        const q = search.toLowerCase();
        return userBalances.filter((u) => {
            const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
            const inUser =
                fullName.includes(q) ||
                u.email.toLowerCase().includes(q);
            const inBalances = u.balances.some(
                (b) =>
                    b.leaveTypeName.toLowerCase().includes(q)
            );
            return inUser || inBalances;
        });
    }, [userBalances, search]);

    const filteredLeaveRequests = useMemo(() => {
        if (!search.trim()) return leaveRequests;
        const q = search.toLowerCase();
        return leaveRequests.filter((req) => {
            const empName = `${req.requestedBy?.firstName} ${req.requestedBy?.lastName}`.toLowerCase();
            const leaveName = typeof req.type === "object" ? req.type.name.toLowerCase() : String(req.type).toLowerCase();
            return empName.includes(q) || leaveName.includes(q);
        });
    }, [leaveRequests, search]);

    return {
        role,
        activeTab,
        setActiveTab,
        search,
        setSearch,
        leaveTypes,
        leaveTypesLoading,
        leaveTypesPage,
        setLeaveTypesPage,
        leaveTypesTotal,
        selectedLeaveType,
        isLeaveTypeModalOpen,
        userBalances,
        balancesLoading,
        balancesPage,
        setBalancesPage,
        balancesTotal,
        leaveRequests,
        leaveRequestCounts,
        requestsLoading,
        requestsPage,
        setRequestsPage,
        requestsTotal,
        requestsLimit,
        selectedUserForEdit,
        setSelectedUserForEdit,
        isCreateModalOpen,
        setIsCreateModalOpen,
        handleAddLeaveType,
        handleEditLeaveType,
        handleLeaveTypeModalClose,
        handleLeaveTypeSuccess,
        handleCreateBalanceSuccess,
        handleEditBalanceSuccess,
        filteredLeaveTypes,
        filteredUserBalances,
        filteredLeaveRequests,
        fetchLeaveRequests,
        fetchLeaveRequestCounts,
        departmentStatusFilter,
        setDepartmentStatusFilter,
        selectedDepartmentId,
        setSelectedDepartmentId,
        departmentStatsLoading,
        departmentStats,
        departmentUsersLoading,
        departmentUsers,
        departmentLeaveTypes,
        fetchDepartmentStats,
        fetchDepartmentUsers
    };
}
