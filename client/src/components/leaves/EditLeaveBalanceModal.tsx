import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import { Trash2, Plus } from "lucide-react";

interface EditLeaveBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userBalance: UserLeaveBalance | null;
    allLeaveTypes: LeaveType[];
}

interface AllocationState {
    leaveTypeId: string;
    amount: number;
}

export default function EditLeaveBalanceModal({
    isOpen,
    onClose,
    onSuccess,
    userBalance,
    allLeaveTypes,
}: EditLeaveBalanceModalProps) {
    const [allocations, setAllocations] = useState<AllocationState[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && userBalance) {
            const initial = userBalance.balances.map(b => ({
                leaveTypeId: b.leaveTypeId,
                amount: b.balance
            }));
            setAllocations(initial);
        } else {
            setAllocations([]);
        }
    }, [isOpen, userBalance]);



    const handleRemoveAllocation = (index: number) => {
        const newAllocations = [...allocations];
        newAllocations.splice(index, 1);
        setAllocations(newAllocations);
    };

    const handleUpdateAllocation = (index: number, field: "leaveTypeId" | "amount", value: string | number) => {
        const newAllocations = [...allocations];
        if (field === "amount") {
            const val = Number(value);
            newAllocations[index].amount = isNaN(val) ? 0 : val;
        } else {
            newAllocations[index].leaveTypeId = String(value);
        }
        setAllocations(newAllocations);
    };

    const handleSave = async () => {
        if (!userBalance) return;

        const validAllocations = allocations.filter(a => a.leaveTypeId && a.amount >= 0);

        setSaving(true);
        try {
            const payload = {
                user: userBalance.userId,
                leaves: validAllocations.map(a => ({
                    type: a.leaveTypeId,
                    amount: a.amount
                }))
            };

            const result = await ApiCaller({
                requestType: "PUT",
                paths: ["api", "v1", "leaves", "balances", userBalance.userId],
                body: payload
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                console.error("Failed to update leave balance:", result.response.message);
                // toast error
            }
        } catch (error) {
            console.error("Error updating leave balance:", error);
        } finally {
            setSaving(false);
        }
    };

    const getAvailableTypesForIndex = (currentIndex: number = -1, allLeaveTypes: LeaveType[]) => {
        const selectedInOtherRows = new Set(
            allocations.filter((_, idx) => idx !== currentIndex).map(a => a.leaveTypeId)
        );

        return allLeaveTypes.filter(t => !selectedInOtherRows.has(t._id));
    };

    if (!userBalance) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Leave Allocations</DialogTitle>
                    <DialogDescription>
                        Manage leave types for {userBalance.firstName} {userBalance.lastName}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <div className="flex-1">Leave Type</div>
                        <div className="w-24 text-right">Balance</div>
                        <div className="w-10"></div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {allocations.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-4 border border-dashed rounded-md">
                                No leave types assigned.
                            </div>
                        ) : (
                            allocations.map((alloc, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <Select
                                            value={alloc.leaveTypeId}
                                            onValueChange={(val) => handleUpdateAllocation(index, "leaveTypeId", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getAvailableTypesForIndex(index, allLeaveTypes).map((lt) => (
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
                                            min={0}
                                            value={alloc.amount}
                                            onChange={(e) => handleUpdateAllocation(index, "amount", e.target.value)}
                                            className="text-right"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveAllocation(index)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const available = getAvailableTypesForIndex(-1, allLeaveTypes);
                                if (available.length > 0) {
                                    setAllocations([...allocations, { leaveTypeId: available[0]._id, amount: 0 }]);
                                }
                            }}
                            disabled={getAvailableTypesForIndex(-1, allLeaveTypes).length === 0}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Leave Type
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
