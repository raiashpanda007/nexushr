import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveBalanceEntry } from "@/components/leaves/LeaveBalancesTable";

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

    const days = calcDays(from, to);
    const selectedBalance = balances.find(b => b.leaveTypeId === selectedTypeId);

    useEffect(() => {
        if (isOpen) {
            setSelectedTypeId(balances[0]?.leaveTypeId ?? "");
            setFrom("");
            setTo("");
            setError(null);
        }
    }, [isOpen, balances]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedTypeId) return setError("Please select a leave type.");
        if (!from || !to) return setError("Please select a date range.");
        if (days < 1) return setError("'To' date must be on or after 'From' date.");
        if (selectedBalance && days > selectedBalance.balance)
            return setError(`Insufficient balance. You only have ${selectedBalance.balance} day(s) left.`);

        setLoading(true);
        try {
            const result = await ApiCaller<ApplyLeaveBody, unknown>({
                requestType: "POST",
                paths: ["api", "v1", "leaves", "requests"],
                body: { type: selectedTypeId, quantity: days, from, to },
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
        days,
        selectedBalance,
        handleSubmit
    };
}
