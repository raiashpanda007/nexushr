import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ClipboardList,
    UserCircle,
    CalendarRange,
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    Hourglass,
    Loader2,
    Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaveRequestsTable } from "@/hooks/leaves/useLeaveRequestsTable";

export interface LeaveRequest {
    _id: string;
    requestedBy: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    type: { _id: string; name: string } | string;
    quantity: number;
    from: string;
    to: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
}

interface LeaveRequestsTableProps {
    requests: LeaveRequest[];
    onRefresh: () => void;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function leaveTypeName(type: LeaveRequest["type"]): string {
    if (typeof type === "object" && type !== null) return type.name;
    return String(type);
}

function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
    const config = {
        PENDING: {
            label: "Pending",
            icon: <Hourglass className="h-3 w-3" />,
            cls: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
        },
        ACCEPTED: {
            label: "Accepted",
            icon: <CheckCircle2 className="h-3 w-3" />,
            cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
        },
        REJECTED: {
            label: "Rejected",
            icon: <XCircle className="h-3 w-3" />,
            cls: "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40",
        },
    };
    const { label, icon, cls } = config[status] ?? config.PENDING;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", cls)}>
            {icon} {label}
        </span>
    );
}

export default function LeaveRequestsTable({ requests, onRefresh }: LeaveRequestsTableProps) {
    const { processingId, handleAction } = useLeaveRequestsTable(onRefresh);

    if (requests.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Inbox className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No leave requests</p>
                    <p className="text-sm mt-1">All caught up! No pending requests to review.</p>
                </CardContent>
            </Card>
        );
    }

    const pendingCount = requests.filter(r => r.status === "PENDING").length;
    const acceptedCount = requests.filter(r => r.status === "ACCEPTED").length;

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-linear-to-r from-sky-600 via-blue-600 to-indigo-600 text-white pb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Leave Requests</CardTitle>
                            <p className="text-white/70 text-sm mt-0.5">
                                {requests.length} request{requests.length !== 1 ? "s" : ""} total
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                            <Hourglass className="h-3.5 w-3.5 text-amber-300" />
                            <div className="text-right">
                                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Pending</p>
                                <p className="text-lg font-bold text-amber-300">{pendingCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                            <div className="text-right">
                                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Accepted</p>
                                <p className="text-lg font-bold text-emerald-300">{acceptedCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <UserCircle className="h-3.5 w-3.5 text-blue-500" /> Employee
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-teal-500" /> Leave Type
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarRange className="h-3.5 w-3.5 text-indigo-500" /> Period
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold text-center">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-orange-500" /> Days
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Applied</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((req, index) => (
                            <TableRow
                                key={req._id}
                                className={cn(
                                    "transition-colors group",
                                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                )}
                            >
                                {/* Employee */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold shrink-0 shadow-sm">
                                            {req.requestedBy?.firstName?.[0]}{req.requestedBy?.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">
                                                {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{req.requestedBy?.email}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Leave Type */}
                                <TableCell>
                                    <span className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full text-xs font-medium border border-teal-200/60 dark:border-teal-800/40">
                                        <CalendarDays className="h-3 w-3" />
                                        {leaveTypeName(req.type)}
                                    </span>
                                </TableCell>

                                {/* Period */}
                                <TableCell>
                                    <div className="text-sm">
                                        <span className="font-medium">{fmtDate(req.from)}</span>
                                        <span className="text-muted-foreground mx-1.5">→</span>
                                        <span className="font-medium">{fmtDate(req.to)}</span>
                                    </div>
                                </TableCell>

                                {/* Days */}
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-200/60 dark:border-orange-800/40">
                                        {req.quantity}
                                    </span>
                                </TableCell>

                                {/* Status */}
                                <TableCell>
                                    <StatusBadge status={req.status} />
                                </TableCell>

                                {/* Applied Date */}
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">{fmtDate(req.createdAt)}</span>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    {req.status === "PENDING" ? (
                                        <div className="flex justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(req._id, "ACCEPTED")}
                                                disabled={processingId === req._id}
                                                className="h-8 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-sm"
                                            >
                                                {processingId === req._id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                )}
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(req._id, "REJECTED")}
                                                disabled={processingId === req._id}
                                                className="h-8 bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-sm"
                                            >
                                                {processingId === req._id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-3 w-3" />
                                                )}
                                                Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs italic">Responded</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
