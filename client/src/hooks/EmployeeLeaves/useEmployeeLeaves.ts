import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
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
export function mapRawDoc(doc: RawLeaveDoc): MyLeaveBalance {
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

export interface LeaveRequest {
    _id: string;
    type: { _id: string; name: string } | string;
    quantity: number;
    from: string;
    to: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
}

export function useEmployeeLeaves() {
    const [myBalance, setMyBalance] = useState<MyLeaveBalance | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsTotal, setRequestsTotal] = useState(0);
    const requestsLimit = 10;

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    // ── Fetchers ─────────────────────────────────────────────────────────────

    const fetchMyBalance = async () => {
        setBalanceLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "balances"],
            });
            if (result.ok && result.response.data) {
                // Backend wraps as { data: [...], total, page, limit } for employees
                const payload = result.response.data;
                const docs: RawLeaveDoc[] = Array.isArray(payload) ? payload : (payload.data ?? []);
                setMyBalance(docs.length > 0 ? mapRawDoc(docs[0]) : null);
            }
        } finally {
            setBalanceLoading(false);
        }
    };

    const fetchMyRequests = async (currentPage = 1) => {
        setRequestsLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "leaves", "requests"],
                queryParams: { page: currentPage.toString(), limit: requestsLimit.toString() }
            });
            if (result.ok && result.response.data) {
                // Backend always returns paginated wrapper { data: [...], total, page, limit }
                const payload = result.response.data;
                const items: LeaveRequest[] = Array.isArray(payload) ? payload : (payload.data ?? []);
                const total: number = payload.total ?? items.length;
                setLeaveRequests(items);
                setRequestsTotal(total);
            }
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBalance();
    }, []);

    useEffect(() => {
        fetchMyRequests(requestsPage);
    }, [requestsPage]);

    const handleApplySuccess = () => {
        fetchMyBalance();
        fetchMyRequests(requestsPage);
    };

    const balances = myBalance?.balances ?? [];
    const pendingCount = leaveRequests.filter(r => r.status === "PENDING").length;

    return {
        myBalance,
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
    };
}
