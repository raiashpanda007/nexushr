import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { UserLeaveBalance } from "@/components/leaves/LeaveBalancesTable";
import { CreateLeaveBalanceSchema, formatZodErrors } from "@/validations/schemas";

interface CreateLeaveBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingBalances: UserLeaveBalance[];
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export function useCreateLeaveBalanceModal({ isOpen, onClose, onSuccess, existingBalances }: CreateLeaveBalanceModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const [allocations, setAllocations] = useState<Array<{ leaveTypeId: string; amount: number }>>([
        { leaveTypeId: "", amount: 0 }
    ]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setSelectedUserId("");
            setAllocations([{ leaveTypeId: "", amount: 0 }]);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const result = await ApiCaller<null, { data: User[] }>({
                requestType: "GET",
                paths: ["api", "v1", "user", "get-users"],
            });

            if (result.ok && result.response.data) {
                const existingUserIds = new Set(existingBalances.map(b => b.userId));
                console.log("::: existingUserIds ::: ", result)
                const usersWithoutBalance = result.response.data.data.filter(u => !existingUserIds.has(u._id));
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
        setError(null);
        setFieldErrors({});

        const validAllocations = allocations.filter(a => a.leaveTypeId && a.amount >= 0);
        
        const payload = {
            user: selectedUserId,
            leaves: validAllocations.map(a => ({
                type: a.leaveTypeId,
                amount: a.amount
            }))
        };

        // Validate with Zod
        const validation = CreateLeaveBalanceSchema.safeParse(payload);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        setSaving(true);
        try {
            const result = await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "leaves", "balances"],
                body: payload
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.response.message || "Failed to create leave balance");
            }
        } catch (err) {
            console.error("Error creating leave balance:", err);
            setError("An error occurred while creating leave balance");
        } finally {
            setSaving(false);
        }
    };

    return {
        users,
        loadingUsers,
        selectedUserId,
        setSelectedUserId,
        allocations,
        setAllocations,
        saving,
        error,
        fieldErrors,
        handleAddAllocation,
        handleRemoveAllocation,
        handleAllocationChange,
        handleSave
    };
}
