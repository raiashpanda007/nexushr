import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveBalanceEntry } from "@/components/leaves/LeaveBalancesTable";
import { CreateLeaveRequestSchema, formatZodErrors } from "@/validations/schemas";

interface ApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    balances: LeaveBalanceEntry[];
}

interface ApplyLeaveBody {
    type: string;
    quantity: number;
    from: string;
    to: string;
}

function calcDays(from: string, to: string): number {
    if (!from || !to) return 0;
    const f = new Date(from).getTime();
    const t = new Date(to).getTime();
    if (t < f) return 0;
    return Math.floor((t - f) / (24 * 60 * 60 * 1000)) + 1;
}

export function useApplyLeaveModal({ isOpen, onClose, onSuccess, balances }: ApplyLeaveModalProps) {
    const [selectedTypeId, setSelectedTypeId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const days = calcDays(from, to);
    const selectedBalance = balances.find(b => b.leaveTypeId === selectedTypeId);

    useEffect(() => {
        if (isOpen) {
            setSelectedTypeId(balances[0]?.leaveTypeId ?? "");
            setFrom("");
            setTo("");
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, balances]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const payload = { type: selectedTypeId, quantity: days, from, to };

        // Validate with Zod
        const validation = CreateLeaveRequestSchema.safeParse(payload);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        // Additional business logic validation
        if (selectedBalance && days > selectedBalance.balance) {
            setError(`Insufficient balance. You only have ${selectedBalance.balance} day(s) left.`);
            return;
        }

        setLoading(true);
        try {
            const result = await ApiCaller<ApplyLeaveBody, unknown>({
                requestType: "POST",
                paths: ["api", "v1", "leaves", "requests"],
                body: payload,
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.response.message || "Failed to submit leave request.");
            }
        } catch {
            setError("Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return {
        selectedTypeId,
        setSelectedTypeId,
        from,
        setFrom,
        to,
        setTo,
        loading,
        error,
        fieldErrors,
        days,
        selectedBalance,
        handleSubmit
    };
}
