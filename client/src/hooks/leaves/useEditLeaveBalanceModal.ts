import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import { UpdateLeaveBalanceSchema, formatZodErrors } from "@/validations/schemas";

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

export function useEditLeaveBalanceModal({ isOpen, onClose, onSuccess, userBalance }: Omit<EditLeaveBalanceModalProps, 'allLeaveTypes'>) {
    const [allocations, setAllocations] = useState<AllocationState[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && userBalance) {
            const initial = userBalance.balances.map(b => ({
                leaveTypeId: b.leaveTypeId,
                amount: b.balance
            }));
            setAllocations(initial);
            setError(null);
            setFieldErrors({});
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
        setError(null);
        setFieldErrors({});

        const validAllocations = allocations.filter(a => a.leaveTypeId && a.amount >= 0);

        const payload = {
            user: userBalance.userId,
            leaves: validAllocations.map(a => ({
                type: a.leaveTypeId,
                amount: a.amount
            }))
        };

        // Validate with Zod
        const validation = UpdateLeaveBalanceSchema.safeParse(payload);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        setSaving(true);
        try {
            const result = await ApiCaller({
                requestType: "PUT",
                paths: ["api", "v1", "leaves", "balances", userBalance.userId],
                body: payload
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.response.message || "Failed to update leave balance");
            }
        } catch (err) {
            console.error("Error updating leave balance:", err);
            setError("An error occurred while updating leave balance");
        } finally {
            setSaving(false);
        }
    };

    return {
        allocations,
        setAllocations,
        saving,
        error,
        fieldErrors,
        handleRemoveAllocation,
        handleUpdateAllocation,
        handleSave
    };
}
