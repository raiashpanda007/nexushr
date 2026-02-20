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
    const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
    const [isLeaveTypeModalOpen, setIsLeaveTypeModalOpen] = useState(false);

    const [userBalances, setUserBalances] = useState<UserLeaveBalance[]>([]);
    const [balancesLoading, setBalancesLoading] = useState(false);

    const fetchLeaveTypes = async () => {
        setLeaveTypesLoading(true);
        try {
            const result = await ApiCaller<null, LeaveType[]>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "types"],
            });

            if (result.ok) {
                setLeaveTypes(result.response.data || []);
            } else {
                console.error("Failed to fetch leave types:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching leave types:", error);
        } finally {
            setLeaveTypesLoading(false);
        }
    };

    const fetchUserBalances = async () => {
        setBalancesLoading(true);
        try {
            const result = await ApiCaller<null, RawLeaveBalanceDoc[]>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "balances"],
            });

            if (result.ok) {
                const raw = result.response.data || [];
                setUserBalances(raw.map(mapRawToUserLeaveBalance));
            } else {
                console.error("Failed to fetch leave balances:", result.response.message);
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
            fetchLeaveTypes();
            fetchUserBalances();
        }
    }, [role]);

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
        fetchLeaveTypes();
    };

    const handleCreateBalanceSuccess = () => {
        fetchUserBalances();
    };

    const handleEditBalanceSuccess = () => {
        fetchUserBalances();
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
                        <LeaveTypeTable leaveTypes={filteredLeaveTypes} onEdit={handleEditLeaveType} />
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
                        <LeaveBalancesTable
                            users={filteredUserBalances}
                            onEdit={(user) => setSelectedUserForEdit(user)}
                        />
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

