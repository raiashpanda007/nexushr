import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ApiCaller from "@/utils/ApiCaller";
import ApplyLeaveModal from "@/components/leaves/ApplyLeaveModal";
import type { LeaveBalanceEntry } from "@/components/leaves/LeaveBalancesTable";

// ── Types ────────────────────────────────────────────────────────────────────

/** Raw shape returned by the backend aggregate */
interface RawLeaveDoc {
    _id: string;
    user: string;
    userDetails?: { _id: string; firstName: string; lastName: string; email: string };
    leaves: Array<{
        type: string;
        amount: number;
        typeDetails?: { _id: string; name: string };
    }>;
}

interface MyLeaveBalance {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    balances: LeaveBalanceEntry[];
}

/** Map backend raw doc → display shape */
function mapRawDoc(doc: RawLeaveDoc): MyLeaveBalance {
    return {
        userId: doc._id,
        firstName: doc.userDetails?.firstName ?? "",
        lastName: doc.userDetails?.lastName ?? "",
        email: doc.userDetails?.email ?? "",
        balances: doc.leaves.map((l) => ({
            leaveTypeId: l.typeDetails?._id ?? String(l.type),
            leaveTypeName: l.typeDetails?.name ?? "Unknown",
            balance: l.amount,
        })),
    };
}

interface LeaveRequest {
    _id: string;
    type: { _id: string; name: string } | string;
    quantity: number;
    from: string;
    to: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Balance Card ─────────────────────────────────────────────────────────────

const PALETTE = [
    "from-violet-500 to-indigo-500",
    "from-rose-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-sky-500 to-cyan-500",
    "from-fuchsia-500 to-purple-500",
];

function BalanceCard({ entry, index }: { entry: LeaveBalanceEntry; index: number }) {
    const gradient = PALETTE[index % PALETTE.length];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            {/* gradient blob */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-15 blur-2xl`} />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{entry.leaveTypeName}</p>
                    <p className="text-4xl font-bold mt-1">{entry.balance}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">days available</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow`}>
                    🏖
                </div>
            </div>

            {/* progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                    style={{ width: `${entry.balance > 0 ? Math.min(100, (entry.balance / 30) * 100) : 5}%` }}
                />
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployeeLeaves() {
    const [myBalance, setMyBalance] = useState<MyLeaveBalance | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    // ── Fetchers ─────────────────────────────────────────────────────────────

    const fetchMyBalance = async () => {
        setBalanceLoading(true);
        try {
            const result = await ApiCaller<null, RawLeaveDoc[]>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "balances"],
            });
            if (result.ok && result.response.data) {
                const raw = result.response.data;
                // Backend returns an array; employee gets their own single record
                const docs = Array.isArray(raw) ? raw : [raw];
                setMyBalance(docs.length > 0 ? mapRawDoc(docs[0]) : null);
            }
        } finally {
            setBalanceLoading(false);
        }
    };

    const fetchMyRequests = async () => {
        setRequestsLoading(true);
        try {
            // GET /api/v1/leaves/requests/:id — passing a dummy ':id' placeholder as backend
            // returns all of this user's requests when role == EMPLOYEE
            const result = await ApiCaller<null, LeaveRequest[]>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "requests"],
            });
            if (result.ok && result.response.data) {
                console.log(result.response.data);
                setLeaveRequests(Array.isArray(result.response.data) ? result.response.data : []);
            }
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBalance();
        fetchMyRequests();
    }, []);

    const handleApplySuccess = () => {
        fetchMyBalance();
        fetchMyRequests();
    };

    const balances = myBalance?.balances ?? [];
    const pendingCount = leaveRequests.filter(r => r.status === "PENDING").length;

    // ── Render ────────────────────────────────────────────────────────────────

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
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-violet-500/25 transition-all"
                >
                    <span className="mr-2">✚</span>
                    Apply for Leave
                </Button>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Types", value: balances.length, icon: "📋" },
                    { label: "Pending Requests", value: pendingCount, icon: "⏳" },
                    { label: "Accepted", value: leaveRequests.filter(r => r.status === "ACCEPTED").length, icon: "✅" },
                    { label: "Rejected", value: leaveRequests.filter(r => r.status === "REJECTED").length, icon: "❌" },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
                        <span className="text-2xl">{stat.icon}</span>
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
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                        <p className="text-4xl mb-3">🏖</p>
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

            {/* ── Leave History Table ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">My Leave Requests</h2>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{leaveRequests.length} total</span>
                </div>

                {requestsLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : leaveRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                        <p className="text-4xl mb-3">📄</p>
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
                                            <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium">{leaveTypeName(req.type)}</td>
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
                        </div>
                    </div>
                )}
            </section>

            {/* ── Apply Leave Modal ── */}
            <ApplyLeaveModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onSuccess={handleApplySuccess}
                balances={balances}
            />
        </div>
    );
}
