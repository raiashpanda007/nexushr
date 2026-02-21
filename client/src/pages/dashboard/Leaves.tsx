import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ApiCaller from "@/utils/ApiCaller";
import LeaveTypeTable, { type LeaveType } from "@/components/leaves/LeaveTypeTable";
import LeaveTypeModal from "@/components/leaves/LeaveTypeModal";
import LeaveBalancesTable, { type UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import CreateLeaveBalanceModal from "@/components/leaves/CreateLeaveBalanceModal";
import EditLeaveBalanceModal from "@/components/leaves/EditLeaveBalanceModal";
import EmployeeLeaves from "@/pages/dashboard/EmployeeLeaves";
import LeaveRequestsTable, { type LeaveRequest } from "@/components/leaves/LeaveRequestsTable";


interface RawLeaveBalanceDoc {
    _id: string;
    user: string;
    userDetails?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
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
        userId: doc._id,
        firstName: doc.userDetails?.firstName ?? "",
        lastName: doc.userDetails?.lastName ?? "",
        email: doc.userDetails?.email ?? "",
        department: doc.userDetails?.department?.name ?? "",
        balances: (doc.leaves ?? []).map((l) => ({
            leaveTypeId: l.typeDetails?._id ?? String(l.type),
            leaveTypeName: l.typeDetails?.name ?? "Unknown",
            balance: l.amount,
        })),
    };
}

export default function Leaves() {
    const { userDetails } = useAppSelector((state) => state.userState);
    const role = userDetails?.role?.toUpperCase();

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

    const fetchLeaveRequests = async (currentPage = 1) => {
        setRequestsLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "requests"],
                queryParams: { page: currentPage.toString(), limit: requestsLimit.toString() }
            });

            if (result.ok) {
                if (Array.isArray(result.response.data)) {
                    setLeaveRequests(result.response.data);
                } else if (result.response.data?.data) {
                    setLeaveRequests(result.response.data.data);
                    setRequestsTotal(result.response.data.total || 0);
                }
            } else {
                console.error("Failed to fetch leave requests:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching leave requests:", error);
        } finally {
            setRequestsLoading(false);
        }
    };

    const fetchLeaveTypes = async (currentPage = 1) => {
        setLeaveTypesLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "types"],
                queryParams: { page: currentPage.toString(), limit: "10" }
            });

            if (result.ok) {
                if (Array.isArray(result.response.data)) {
                    setLeaveTypes(result.response.data);
                } else if (result.response.data?.data) {
                    setLeaveTypes(result.response.data.data);
                    setLeaveTypesTotal(result.response.data.total || 0);
                }
            }
        } catch (error) {
            console.error("Error fetching leave types:", error);
        } finally {
            setLeaveTypesLoading(false);
        }
    };

    const fetchUserBalances = async (currentPage = 1) => {
        setBalancesLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "balances"],
                queryParams: { page: currentPage.toString(), limit: "10" }
            });

            if (result.ok) {
                const data = result.response.data;
                const raw = Array.isArray(data) ? data : (data?.data || []);
                setUserBalances(raw.map(mapRawToUserLeaveBalance));
                setBalancesTotal(data?.total || 0);
            }
        } catch (error) {
            console.error("Error fetching leave balances:", error);
        } finally {
            setBalancesLoading(false);
        }
    };

    const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserLeaveBalance | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (role === "HR") {
            fetchLeaveTypes(leaveTypesPage);
        }
    }, [role, leaveTypesPage]);

    useEffect(() => {
        if (role === "HR") {
            fetchUserBalances(balancesPage);
        }
    }, [role, balancesPage]);

    useEffect(() => {
        if (role === "HR") {
            fetchLeaveRequests(requestsPage);
        }
    }, [role, requestsPage]);

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
        fetchLeaveTypes(leaveTypesPage);
    };

    const handleCreateBalanceSuccess = () => {
        fetchUserBalances(balancesPage);
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

    // Employee view — delegate to dedicated component
    if (role !== "HR") {
        return <EmployeeLeaves />;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                    <p className="text-muted-foreground">
                        Manage leave types and employee leave balances.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search leave types or employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-80"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Leave Types</h2>
                    <Button onClick={handleAddLeaveType}>Add Leave Type</Button>
                </div>
                <div className="bg-white rounded-lg shadow">
                    {leaveTypesLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading leave types...</div>
                    ) : (
                        <>
                            <LeaveTypeTable leaveTypes={filteredLeaveTypes} onEdit={handleEditLeaveType} />
                            {leaveTypesTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Showing {(leaveTypesPage - 1) * 10 + 1} to {Math.min(leaveTypesPage * 10, leaveTypesTotal)} of {leaveTypesTotal}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLeaveTypesPage(p => Math.max(1, p - 1))}
                                            disabled={leaveTypesPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLeaveTypesPage(p => Math.min(Math.ceil(leaveTypesTotal / 10), p + 1))}
                                            disabled={leaveTypesPage === Math.ceil(leaveTypesTotal / 10) || Math.ceil(leaveTypesTotal / 10) === 0}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Employee Leave Balances</h2>
                    <Button onClick={() => setIsCreateModalOpen(true)}>Create Leave Balance</Button>
                </div>
                <div className="bg-white rounded-lg shadow">
                    {balancesLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading leave balances...</div>
                    ) : (
                        <>
                            <LeaveBalancesTable
                                users={filteredUserBalances}
                                onEdit={(user) => setSelectedUserForEdit(user)}
                            />
                            {balancesTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Showing {(balancesPage - 1) * 10 + 1} to {Math.min(balancesPage * 10, balancesTotal)} of {balancesTotal}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBalancesPage(p => Math.max(1, p - 1))}
                                            disabled={balancesPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBalancesPage(p => Math.min(Math.ceil(balancesTotal / 10), p + 1))}
                                            disabled={balancesPage === Math.ceil(balancesTotal / 10) || Math.ceil(balancesTotal / 10) === 0}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Leave Requests</h2>
                </div>
                <div className="bg-white rounded-lg shadow">
                    {requestsLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading leave requests...</div>
                    ) : (
                        <>
                            <LeaveRequestsTable
                                requests={filteredLeaveRequests}
                                onRefresh={() => fetchLeaveRequests(requestsPage)}
                            />
                            {requestsTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Showing {(requestsPage - 1) * requestsLimit + 1} to {Math.min(requestsPage * requestsLimit, requestsTotal)} of {requestsTotal} requests
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                                            disabled={requestsPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRequestsPage(p => Math.min(Math.ceil(requestsTotal / requestsLimit), p + 1))}
                                            disabled={requestsPage === Math.ceil(requestsTotal / requestsLimit) || Math.ceil(requestsTotal / requestsLimit) === 0}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <LeaveTypeModal
                isOpen={isLeaveTypeModalOpen}
                onClose={handleLeaveTypeModalClose}
                initialData={selectedLeaveType}
                onSuccess={handleLeaveTypeSuccess}
            />

            <CreateLeaveBalanceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateBalanceSuccess}
                existingBalances={userBalances}
                leaveTypes={leaveTypes}
            />

            <EditLeaveBalanceModal
                isOpen={!!selectedUserForEdit}
                onClose={() => setSelectedUserForEdit(null)}
                onSuccess={handleEditBalanceSuccess}
                userBalance={selectedUserForEdit}
                allLeaveTypes={leaveTypes}
            />
        </div>
    );
}

