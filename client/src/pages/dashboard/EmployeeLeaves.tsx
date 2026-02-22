import { Button } from "@/components/ui/button";
import ApplyLeaveModal from "@/components/leaves/ApplyLeaveModal";
import type { LeaveBalanceEntry } from "@/components/leaves/LeaveBalancesTable";
import { Plus, CheckCircle, XCircle, Clock, FileText, Calendar, List } from "lucide-react";
import { useEmployeeLeaves } from "@/hooks/EmployeeLeaves/useEmployeeLeaves";
import type { LeaveRequest } from "@/hooks/EmployeeLeaves/useEmployeeLeaves";
import { Badge } from "@/components/ui/badge";

function statusBadge(status: LeaveRequest["status"]) {
    const map: Record<LeaveRequest["status"], { label: string; cls: string }> = {
        PENDING: { label: "Pending", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25" },
        ACCEPTED: { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" },
        REJECTED: { label: "Rejected", cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25" },
    };
    const { label, cls } = map[status] ?? map.PENDING;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            {label}
        </span>
    );
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function leaveTypeName(type: LeaveRequest["type"]): string {
    if (typeof type === "object" && type !== null) return type.name;
    return String(type);
}

function BalanceCard({ entry }: { entry: LeaveBalanceEntry }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{entry.leaveTypeName}</p>
                    <p className="text-4xl font-bold mt-1">{entry.balance}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">days available</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shadow-sm">
                    <Calendar className="w-5 h-5" />
                </div>
            </div>

            {/* progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${entry.balance > 0 ? Math.min(100, (entry.balance / 30) * 100) : 5}%` }}
                />
            </div>
        </div>
    );
}


export default function EmployeeLeaves() {
    const {
        balanceLoading,
        leaveRequests,
        requestsLoading,
        requestsPage,
        setRequestsPage,
        requestsTotal,
        requestsLimit,
        isApplyModalOpen,
        setIsApplyModalOpen,
        handleApplySuccess,
        balances,
        pendingCount
    } = useEmployeeLeaves();



    return (
        <div className="p-6 space-y-8">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Leaves</h1>
                    <p className="text-muted-foreground mt-1">
                        View your leave balances and manage your leave requests.
                    </p>
                </div>
                <Button
                    onClick={() => setIsApplyModalOpen(true)}
                    disabled={balances.length === 0}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Apply for Leave
                </Button>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Types", value: balances.length, icon: <List className="w-6 h-6" /> },
                    { label: "Pending Requests", value: pendingCount, icon: <Clock className="w-6 h-6" /> },
                    { label: "Accepted", value: leaveRequests.filter(r => r.status === "ACCEPTED").length, icon: <CheckCircle className="w-6 h-6" /> },
                    { label: "Rejected", value: leaveRequests.filter(r => r.status === "REJECTED").length, icon: <XCircle className="w-6 h-6" /> },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
                        <div className="text-muted-foreground">{stat.icon}</div>
                        <div>
                            <p className="text-2xl font-bold leading-none">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Leave Balance Cards ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Leave Balances</h2>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{balances.length} types</span>
                </div>

                {balanceLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : balances.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="font-medium text-muted-foreground">No leave balances assigned yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Contact your HR team to set up your leave allowances.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {balances.map((b) => (
                            <BalanceCard key={b.leaveTypeId} entry={b} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Leave History Table ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">My Leave Requests</h2>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{requestsTotal || leaveRequests.length} total</span>
                </div>

                {requestsLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : leaveRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
                        <FileText className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="font-medium text-muted-foreground">No leave requests found.</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Apply for Leave" to submit your first request.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Leave Type</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">From</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">To</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Days</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Applied On</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {leaveRequests.map((req, i) => (
                                        <tr key={req._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground">{(requestsPage - 1) * requestsLimit + i + 1}</td>
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    {leaveTypeName(req.type)}
                                                    {req.syncState === 'unsynced' && (
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 uppercase text-[10px] tracking-wider font-semibold">
                                                            Unsynced
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{fmtDate(req.from)}</td>
                                            <td className="px-4 py-3">{fmtDate(req.to)}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold">{req.quantity}</span>
                                                <span className="text-muted-foreground"> day{req.quantity !== 1 ? "s" : ""}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(req.createdAt)}</td>
                                            <td className="px-4 py-3">{statusBadge(req.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {requestsTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-border bg-card">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {(requestsPage - 1) * requestsLimit + 1} to {Math.min(requestsPage * requestsLimit, requestsTotal)} of {requestsTotal} requests
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                                            disabled={requestsPage === 1 || requestsLoading}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRequestsPage(p => Math.min(Math.ceil(requestsTotal / requestsLimit), p + 1))}
                                            disabled={requestsPage === Math.ceil(requestsTotal / requestsLimit) || Math.ceil(requestsTotal / requestsLimit) === 0 || requestsLoading}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <ApplyLeaveModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onSuccess={handleApplySuccess}
                balances={balances}
            />
        </div>
    );
}
