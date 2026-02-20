import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface LeaveBalanceEntry {
    leaveTypeId: string;
    leaveTypeName: string;
    balance: number;
}

export interface UserLeaveBalance {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    balances: LeaveBalanceEntry[];
}

interface LeaveBalancesTableProps {
    users: UserLeaveBalance[];
    onUpdateBalance: (userId: string, leaveTypeId: string, newBalance: number) => Promise<void> | void;
}

export default function LeaveBalancesTable({ users, onUpdateBalance }: LeaveBalancesTableProps) {
    /**
     * Per-user state:
     *   selectedLeaveTypeId – which leave type the select is on
     *   editedBalance        – the value currently typed in the input (or undefined = untouched)
     */
    const [rowState, setRowState] = useState<
        Record<string, { selectedLeaveTypeId: string; editedBalance: string | undefined }>
    >({});
    const [savingUserId, setSavingUserId] = useState<string | null>(null);

    if (!users || users.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No leave balances found.</div>;
    }

    /** Get the resolved row-state for a user, falling back to defaults */
    const getRow = (user: UserLeaveBalance) => {
        const stored = rowState[user.userId];
        const firstId = user.balances[0]?.leaveTypeId ?? "";
        return {
            selectedLeaveTypeId: stored?.selectedLeaveTypeId ?? firstId,
            editedBalance: stored?.editedBalance,
        };
    };

    const handleSelectLeaveType = (userId: string, leaveTypeId: string) => {
        setRowState((prev) => ({
            ...prev,
            [userId]: {
                selectedLeaveTypeId: leaveTypeId,
                editedBalance: undefined, // reset edit when switching types
            },
        }));
    };

    const handleBalanceChange = (userId: string, leaveTypeId: string, value: string) => {
        setRowState((prev) => ({
            ...prev,
            [userId]: {
                selectedLeaveTypeId: leaveTypeId,
                editedBalance: value,
            },
        }));
    };

    const handleSave = async (user: UserLeaveBalance) => {
        const { selectedLeaveTypeId, editedBalance } = getRow(user);
        const entry = user.balances.find((b) => b.leaveTypeId === selectedLeaveTypeId);
        const currentBalance = entry?.balance ?? 0;
        const parsed =
            editedBalance === undefined || editedBalance === ""
                ? currentBalance
                : Number(editedBalance);

        if (Number.isNaN(parsed) || parsed < 0) return;

        setSavingUserId(user.userId);
        try {
            await onUpdateBalance(user.userId, selectedLeaveTypeId, parsed);
        } finally {
            setSavingUserId(null);
            // Clear the edit state so it refreshes from the prop
            setRowState((prev) => ({
                ...prev,
                [user.userId]: {
                    selectedLeaveTypeId,
                    editedBalance: undefined,
                },
            }));
        }
    };

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Balance (days)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user, idx) => {
                        const { selectedLeaveTypeId, editedBalance } = getRow(user);
                        const selectedEntry = user.balances.find(
                            (b) => b.leaveTypeId === selectedLeaveTypeId
                        );
                        const isSaving = savingUserId === user.userId;

                        return (
                            <TableRow key={user.userId}>
                                {/* No. */}
                                <TableCell>{idx + 1}</TableCell>

                                {/* Name */}
                                <TableCell className="font-medium">
                                    {user.firstName} {user.lastName}
                                </TableCell>

                                {/* Email */}
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.email}
                                </TableCell>

                                {/* Department */}
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.department || "-"}
                                </TableCell>

                                {/* Leave Type – select */}
                                <TableCell className="min-w-[160px]">
                                    <select
                                        value={selectedLeaveTypeId}
                                        disabled={user.balances.length === 0 || isSaving}
                                        onChange={(e) =>
                                            handleSelectLeaveType(user.userId, e.target.value)
                                        }
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm
                                                   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                                                   disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                    >
                                        {user.balances.length === 0 ? (
                                            <option value="">No leave types</option>
                                        ) : (
                                            user.balances.map((b) => (
                                                <option key={b.leaveTypeId} value={b.leaveTypeId}>
                                                    {b.leaveTypeName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </TableCell>

                                {/* Balance – input */}
                                <TableCell className="max-w-[140px]">
                                    <Input
                                        type="number"
                                        min={0}
                                        disabled={!selectedEntry || isSaving}
                                        value={
                                            editedBalance !== undefined
                                                ? editedBalance
                                                : (selectedEntry?.balance ?? "")
                                        }
                                        onChange={(e) =>
                                            handleBalanceChange(
                                                user.userId,
                                                selectedLeaveTypeId,
                                                e.target.value
                                            )
                                        }
                                    />
                                </TableCell>

                                {/* Save */}
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isSaving || !selectedEntry}
                                        onClick={() => handleSave(user)}
                                    >
                                        {isSaving ? "Saving…" : "Save"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
