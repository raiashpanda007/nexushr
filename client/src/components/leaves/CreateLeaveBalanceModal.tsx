import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";

interface CreateLeaveBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingBalances: UserLeaveBalance[];
    leaveTypes: LeaveType[];
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function CreateLeaveBalanceModal({
    isOpen,
    onClose,
    onSuccess,
    existingBalances,
    leaveTypes,
}: CreateLeaveBalanceModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // State for managing multiple leave allocations
    // Each allocation is { leaveTypeId, amount }
    const [allocations, setAllocations] = useState<Array<{ leaveTypeId: string; amount: number }>>([
        { leaveTypeId: "", amount: 0 }
    ]);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            // Reset form
            setSelectedUserId("");
            setAllocations([{ leaveTypeId: "", amount: 0 }]);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            // Fetch all users
            const result = await ApiCaller<null, User[]>({
                requestType: "GET",
                paths: ["api", "v1", "user", "get-users"],
            });

            if (result.ok && result.response.data) {
                // Filter users who already have a leave balance
                const existingUserIds = new Set(existingBalances.map(b => b.userId));
                const usersWithoutBalance = result.response.data.filter(u => !existingUserIds.has(u._id));
                setUsers(usersWithoutBalance);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAddAllocation = () => {
        setAllocations([...allocations, { leaveTypeId: "", amount: 0 }]);
    };

    const handleRemoveAllocation = (index: number) => {
        const newAllocations = [...allocations];
        newAllocations.splice(index, 1);
        setAllocations(newAllocations);
    };

    const handleAllocationChange = (index: number, field: "leaveTypeId" | "amount", value: string | number) => {
        const newAllocations = [...allocations];
        if (field === "amount") {
            newAllocations[index].amount = Number(value);
        } else {
            newAllocations[index].leaveTypeId = String(value);
        }
        setAllocations(newAllocations);
    };

    const handleSave = async () => {
        if (!selectedUserId) return;

        // Filter out invalid allocations
        const validAllocations = allocations.filter(a => a.leaveTypeId && a.amount >= 0);
        if (validAllocations.length === 0) return;

        setSaving(true);
        try {
            const payload = {
                user: selectedUserId,
                leaves: validAllocations.map(a => ({
                    type: a.leaveTypeId,
                    amount: a.amount
                }))
            };

            const result = await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "leaves", "balances"],
                body: payload
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                console.error("Failed to create leave balance:", result.response.message);
                // Ideally show toast error
            }
        } catch (error) {
            console.error("Error creating leave balance:", error);
        } finally {
            setSaving(false);
        }
    };

    // Check LeaveBalance.types.js again.
    // CreateLeaveBalanceValidationSchema: leaves: zod.array(zod.object({ types: zod.string(), amount: zod.number() }))
    // So backend expects "types" key for the leave type ID. 

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Leave Balance</DialogTitle>
                    <DialogDescription>
                        Assign leave balances to a user who doesn't have one yet.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Employee</Label>
                        {loadingUsers ? (
                            <div className="text-sm text-muted-foreground">Loading users...</div>
                        ) : (
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.length === 0 ? (
                                        <SelectItem value="none" disabled>No eligible employees found</SelectItem>
                                    ) : (
                                        users.map((u) => (
                                            <SelectItem key={u._id} value={u._id}>
                                                {u.firstName} {u.lastName} ({u.email})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Leave Allocations</Label>
                        {allocations.map((alloc, index) => (
                            <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Select
                                        value={alloc.leaveTypeId}
                                        onValueChange={(val) => handleAllocationChange(index, "leaveTypeId", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaveTypes.map((lt) => (
                                                <SelectItem key={lt._id} value={lt._id}>
                                                    {lt.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24">
                                    <Input
                                        type="number"
                                        placeholder="Days"
                                        min={0}
                                        value={alloc.amount}
                                        onChange={(e) => handleAllocationChange(index, "amount", e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveAllocation(index)}
                                    disabled={allocations.length === 1}
                                >
                                    <span className="sr-only">Remove</span>
                                    ✕
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddAllocation}
                            className="mt-2"
                        >
                            + Add Another Type
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || !selectedUserId}>
                        {saving ? "Creating..." : "Create Balance"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
