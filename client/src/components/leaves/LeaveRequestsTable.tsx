import { Button } from "@/components/ui/button";
import ApiCaller from "@/utils/ApiCaller";
import { useState } from "react";

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

export default function LeaveRequestsTable({ requests, onRefresh }: LeaveRequestsTableProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (id: string, newStatus: "ACCEPTED" | "REJECTED") => {
        setProcessingId(id);
        try {
            const result = await ApiCaller<{ status: string }, unknown>({
                requestType: "PUT",
                paths: ["api", "v1", "leaves", "requests", id],
                body: { status: newStatus },
            });
            if (result.ok) {
                onRefresh();
            } else {
                console.error("Failed to update status:", result.response?.message);
                alert("Failed to update status: " + (result.response?.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error updating status.");
        } finally {
            setProcessingId(null);
        }
    };

    if (requests.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No leave requests found.</div>;
    }

    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 font-medium">Leave Type</th>
                        <th className="px-4 py-3 font-medium">From</th>
                        <th className="px-4 py-3 font-medium">To</th>
                        <th className="px-4 py-3 font-medium">Days</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Applied On</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {requests.map((req) => (
                        <tr key={req._id} className="hover:bg-muted/20">
                            <td className="px-4 py-3">
                                <div className="font-medium">
                                    {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">{req.requestedBy?.email}</div>
                            </td>
                            <td className="px-4 py-3">{leaveTypeName(req.type)}</td>
                            <td className="px-4 py-3">{fmtDate(req.from)}</td>
                            <td className="px-4 py-3">{fmtDate(req.to)}</td>
                            <td className="px-4 py-3 font-medium">{req.quantity}</td>
                            <td className="px-4 py-3">{statusBadge(req.status)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(req.createdAt)}</td>
                            <td className="px-4 py-3">
                                {req.status === "PENDING" ? (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => handleAction(req._id, "ACCEPTED")}
                                            disabled={processingId === req._id}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleAction(req._id, "REJECTED")}
                                            disabled={processingId === req._id}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-xs italic">Responded</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
