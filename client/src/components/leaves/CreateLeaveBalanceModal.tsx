import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import { useCreateLeaveBalanceModal } from "@/hooks/leaves/useCreateLeaveBalanceModal";

interface CreateLeaveBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingBalances: UserLeaveBalance[];
    leaveTypes: LeaveType[];
}

export default function CreateLeaveBalanceModal({
    isOpen,
    onClose,
    onSuccess,
    existingBalances,
    leaveTypes,
}: CreateLeaveBalanceModalProps) {
    const {
        users,
        loadingUsers,
        selectedUserId,
        setSelectedUserId,
        allocations,
        saving,
        handleAddAllocation,
        handleRemoveAllocation,
        handleAllocationChange,
        handleSave
    } = useCreateLeaveBalanceModal({ isOpen, onClose, onSuccess, existingBalances });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">
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
