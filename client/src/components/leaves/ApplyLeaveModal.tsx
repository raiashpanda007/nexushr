import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeaveBalanceEntry } from "./LeaveBalancesTable";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { useApplyLeaveModal } from "@/hooks/leaves/useApplyLeaveModal";

interface ApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    balances: LeaveBalanceEntry[];
}

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess, balances }: ApplyLeaveModalProps) {
    const {
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
    } = useApplyLeaveModal({ isOpen, onClose, onSuccess, balances });

    return isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Apply for Leave</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">Select a leave type and date range</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Leave Type */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Leave Type</label>
                        <select
                            value={selectedTypeId}
                            onChange={e => setSelectedTypeId(e.target.value)}
                            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                        >
                            {balances.length === 0 && (
                                <option value="">No leave balances available</option>
                            )}
                            {balances.map(b => (
                                <option key={b.leaveTypeId} value={b.leaveTypeId}>
                                    {b.leaveTypeName} — {b.balance} day{b.balance !== 1 ? "s" : ""} left
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Balance indicator */}
                    {selectedBalance && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${selectedBalance.balance > 0
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                            }`}>
                            {selectedBalance.balance > 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span>
                                {selectedBalance.balance} day{selectedBalance.balance !== 1 ? "s" : ""} available for {selectedBalance.leaveTypeName}
                            </span>
                        </div>
                    )}

                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">From</label>
                            <Input
                                type="date"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">To</label>
                            <Input
                                type="date"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                min={from || new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    </div>

                    {/* Days summary */}
                    {days > 0 && (
                        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-lg text-sm">
                            <span className="text-muted-foreground">Total days requested</span>
                            <span className="font-bold text-lg">{days}</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading || balances.length === 0}
                        >
                            {loading ? "Submitting…" : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
}
