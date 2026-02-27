import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import { useCreateLeaveBalanceModal } from "@/hooks/leaves/useCreateLeaveBalanceModal";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

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
    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const {
        users,
        loadingUsers,
        selectedUserId,
        setSelectedUserId,
        allocations,
        saving,
        error,
        fieldErrors,
        handleAddAllocation,
        handleRemoveAllocation,
        handleAllocationChange,
        handleSave
    } = useCreateLeaveBalanceModal({ isOpen, onClose, onSuccess, existingBalances });

    const selectedUser = users.find((user) => user._id === selectedUserId);

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
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="space-y-2">
                        <Label>Employee</Label>
                        {loadingUsers ? (
                            <div className="text-sm text-muted-foreground">Loading users...</div>
                        ) : (
                            <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={employeeSearchOpen}
                                        className={cn(
                                            "w-full justify-between font-normal",
                                            !selectedUser && "text-muted-foreground",
                                            fieldErrors.user && "border-red-500"
                                        )}
                                    >
                                        {selectedUser
                                            ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
                                            : "Search and select an employee..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search by name or email..." />
                                        <CommandList>
                                            <CommandEmpty>No eligible employees found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((u) => (
                                                    <CommandItem
                                                        key={u._id}
                                                        value={`${u.firstName} ${u.lastName} ${u.email}`}
                                                        onSelect={() => {
                                                            setSelectedUserId(u._id);
                                                            setEmployeeSearchOpen(false);
                                                        }}
                                                    >
                                                        <span className="truncate">{u.firstName} {u.lastName} ({u.email})</span>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
                                                                selectedUserId === u._id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                        {fieldErrors.user && <p className="text-red-500 text-xs">{fieldErrors.user}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Leave Allocations</Label>
                        {fieldErrors.leaves && <p className="text-red-500 text-xs">{fieldErrors.leaves}</p>}
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
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Creating..." : "Create Balance"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
