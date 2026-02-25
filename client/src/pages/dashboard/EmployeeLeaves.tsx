import { Button } from "@/components/ui/button";
import ApplyLeaveModal from "@/components/leaves/ApplyLeaveModal";
import type { LeaveBalanceEntry } from "@/components/leaves/LeaveBalancesTable";
import { Plus, CheckCircle, XCircle, Clock, FileText, Calendar, List, TreePalm, ChevronLeft, ChevronRight } from "lucide-react";
import { useEmployeeLeaves } from "@/hooks/EmployeeLeaves/useEmployeeLeaves";
import type { LeaveRequest } from "@/hooks/EmployeeLeaves/useEmployeeLeaves";
import { Badge } from "@/components/ui/badge";

function statusBadge(status: LeaveRequest["status"]) {
    const map: Record<LeaveRequest["status"], { label: string; cls: string; icon: React.ReactNode }> = {
        PENDING: { label: "Pending", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25", icon: <Clock className="h-3 w-3" /> },
        ACCEPTED: { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", icon: <CheckCircle className="h-3 w-3" /> },
        REJECTED: { label: "Rejected", cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25", icon: <XCircle className="h-3 w-3" /> },
    };
    const { label, cls, icon } = map[status] ?? map.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            {icon} {label}
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

const balanceColors = [
    { bg: "from-foreground/25 to-foreground/5", light: "bg-muted", text: "text-foreground", bar: "bg-foreground" },
    { bg: "from-foreground/20 to-foreground/5", light: "bg-muted", text: "text-foreground", bar: "bg-foreground/90" },
    { bg: "from-foreground/15 to-foreground/5", light: "bg-muted", text: "text-foreground", bar: "bg-foreground/80" },
    { bg: "from-foreground/25 to-foreground/10", light: "bg-muted", text: "text-foreground", bar: "bg-foreground" },
];

function BalanceCard({ entry, index }: { entry: LeaveBalanceEntry; index: number }) {
    const color = balanceColors[index % balanceColors.length];
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`h-1.5 bg-linear-to-r ${color.bg}`} />
            <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{entry.leaveTypeName}</p>
                        <p className={`text-4xl font-bold mt-1 ${color.text}`}>{entry.balance}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">days available</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center ${color.text} shadow-sm group-hover:scale-110 transition-transform`}>
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                        style={{ width: `${entry.balance > 0 ? Math.min(100, (entry.balance / 30) * 100) : 5}%` }}
                    />
                </div>
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

    const requestsPages = Math.ceil(requestsTotal / requestsLimit);

    const statsConfig = [
        { label: "Total Types", value: balances.length, icon: <List className="w-5 h-5" />, bg: "bg-muted/30", text: "text-foreground", border: "border-border" },
        { label: "Pending", value: pendingCount, icon: <Clock className="w-5 h-5" />, bg: "bg-muted/30", text: "text-foreground", border: "border-border" },
        { label: "Accepted", value: leaveRequests.filter(r => r.status === "ACCEPTED").length, icon: <CheckCircle className="w-5 h-5" />, bg: "bg-muted/30", text: "text-foreground", border: "border-border" },
        { label: "Rejected", value: leaveRequests.filter(r => r.status === "REJECTED").length, icon: <XCircle className="w-5 h-5" />, bg: "bg-muted/30", text: "text-foreground", border: "border-border" },
    ];

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50">
                            <TreePalm className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">My Leaves</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">View your leave balances and manage requests</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsApplyModalOpen(true)}
                        disabled={balances.length === 0}
                        className="font-semibold gap-2 rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        Apply for Leave
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statsConfig.map((stat, i) => (
                    <div key={i} className={`rounded-xl border ${stat.border} ${stat.bg} p-4 flex items-center gap-3 shadow-sm`}>
                        <div className={`${stat.text}`}>{stat.icon}</div>
                        <div>
                            <p className="text-2xl font-bold leading-none">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Leave Balance Cards */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Leave Balances</h2>
                    <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded-full font-medium border border-border">{balances.length} types</span>
                </div>

                {balanceLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : balances.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 p-12 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-10 h-10 mb-3 text-purple-400" />
                        <p className="font-medium text-muted-foreground">No leave balances assigned yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Contact your HR team to set up your leave allowances.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {balances.map((b, i) => (
                            <BalanceCard key={b.leaveTypeId} entry={b} index={i} />
                        ))}
                    </div>
                )}
            </section>

            {/* Leave History Table */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-fuchsia-600" />
                    <h2 className="text-lg font-semibold">My Leave Requests</h2>
                    <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full font-medium">{requestsTotal || leaveRequests.length} total</span>
                </div>

                {requestsLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : leaveRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-fuchsia-200 bg-fuchsia-50/30 p-12 flex flex-col items-center justify-center text-center">
                        <FileText className="w-10 h-10 mb-3 text-fuchsia-400" />
                        <p className="font-medium text-muted-foreground">No leave requests found.</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Apply for Leave" to submit your first request.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-linear-to-r from-purple-50 to-fuchsia-50 border-b border-border">
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">#</th>
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">Leave Type</th>
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">From</th>
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">To</th>
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">Days</th>
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">Applied On</th>
                                        <th className="px-4 py-3 text-left font-semibold text-purple-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {leaveRequests.map((req, i) => (
                                        <tr key={req._id} className="hover:bg-purple-50/40 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground">{(requestsPage - 1) * requestsLimit + i + 1}</td>
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-semibold">{leaveTypeName(req.type)}</span>
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
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">{req.quantity}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(req.createdAt)}</td>
                                            <td className="px-4 py-3">{statusBadge(req.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {requestsTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-border bg-card">
                                    <p className="text-sm text-muted-foreground">
                                        Showing <span className="font-semibold text-foreground">{(requestsPage - 1) * requestsLimit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(requestsPage * requestsLimit, requestsTotal)}</span> of <span className="font-semibold text-foreground">{requestsTotal}</span> requests
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setRequestsPage(p => Math.max(1, p - 1))} disabled={requestsPage === 1 || requestsLoading} className="gap-1">
                                            <ChevronLeft className="h-4 w-4" /> Previous
                                        </Button>
                                        <span className="text-sm font-medium text-muted-foreground px-2">{requestsPage} / {requestsPages || 1}</span>
                                        <Button variant="outline" size="sm" onClick={() => setRequestsPage(p => Math.min(requestsPages, p + 1))} disabled={requestsPage === requestsPages || requestsPages === 0 || requestsLoading} className="gap-1">
                                            Next <ChevronRight className="h-4 w-4" />
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
