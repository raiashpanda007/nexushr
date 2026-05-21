import { useState, useEffect, useRef } from "react";
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
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const [allocations, setAllocations] = useState<Array<{ leaveTypeId: string; amount: number }>>([
        { leaveTypeId: "", amount: 0 }
    ]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedUserId("");
        setUserSearchQuery("");
        setUsers([]);
        setAllocations([{ leaveTypeId: "", amount: 0 }]);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!userSearchQuery.trim()) {
            setUsers([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoadingUsers(true);
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "employees"],
                    queryParams: { query: userSearchQuery.trim(), limit: "20" },
                });

                if (result.ok && Array.isArray(result.response.data)) {
                    const existingUserIds = new Set(existingBalances.map(b => b.userId));
                    setUsers(
                        result.response.data.filter((u: User) => !existingUserIds.has(u._id))
                    );
                }
            } catch (err) {
                console.error("Error searching employees:", err);
            } finally {
                setLoadingUsers(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [userSearchQuery, isOpen, existingBalances]);

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
        userSearchQuery,
        setUserSearchQuery,
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
