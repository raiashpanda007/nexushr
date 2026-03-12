import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ApiCaller from "@/utils/ApiCaller";
import type { Opening } from "@/types/hiring";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export function useHiringDetails(id: string | undefined) {
    const navigate = useNavigate();

    // Opening
    const [opening, setOpening] = useState<Opening | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Link copy
    const [linkCopied, setLinkCopied] = useState(false);

    // Applicants
    const [applicantsList, setApplicantsList] = useState<any[]>([]);
    const [applicantsLoading, setApplicantsLoading] = useState(false);
    const [applicantsError, setApplicantsError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [statusFilter, setStatusFilterState] = useState<string>("");
    const [roundFilter, setRoundFilterState] = useState<string>("");

    // ATS
    const [atsLoading, setAtsLoading] = useState(false);
    const [atsResults, setAtsResults] = useState<any[] | null>(null);
    const atsPollingRef = useRef(false);

    // Applicant filter
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [filterResultDialogOpen, setFilterResultDialogOpen] = useState(false);
    const [filterResult, setFilterResult] = useState<{ rejectedCount: number | null; message: string } | null>(null);

    // Edit opening
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    // Change status
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const setStatusFilter = useCallback((value: string) => {
        setStatusFilterState(value);
        setCurrentPage(1);
    }, []);

    const setRoundFilter = useCallback((value: string) => {
        setRoundFilterState(value);
        setCurrentPage(1);
    }, []);

    // Fetch opening details
    useEffect(() => {
        if (!id) return;
        const fetchOpening = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await ApiCaller<null, Opening>({
                    requestType: "GET",
                    paths: ["api", "v1", "hiring", "openings", id],
                });
                if (result.ok) {
                    setOpening(result.response.data);
                } else {
                    setError((result.response as any)?.message || "Opening not found");
                }
            } catch {
                setError("Failed to fetch opening details");
            } finally {
                setLoading(false);
            }
        };
        fetchOpening();
    }, [id]);

    // Fetch applicants
    const fetchApplicants = useCallback(async () => {
        if (!id) return;
        setApplicantsLoading(true);
        setApplicantsError(null);
        try {
            const queryParams: Record<string, string | number | boolean | undefined> = {
                openingId: id,
                page: currentPage,
                limit: PAGE_SIZE,
            };
            if (statusFilter) queryParams.status = statusFilter;
            if (roundFilter) queryParams.roundId = roundFilter;

            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "hiring", "applicants"],
                queryParams,
            });

            if (result.ok) {
                setApplicantsList(result.response.data.applicants || []);
                setTotalCount(result.response.data.pagination?.totalCount || 0);
                setTotalPages(result.response.data.pagination?.totalPages || 0);
            } else {
                setApplicantsError((result.response as any)?.message || "Failed to fetch applicants");
            }
        } catch {
            setApplicantsError("Error fetching applicants");
        } finally {
            setApplicantsLoading(false);
        }
    }, [id, currentPage, statusFilter, roundFilter]);

    useEffect(() => {
        if (id) fetchApplicants();
    }, [fetchApplicants, id]);

    // Handlers
    const handleDelete = async () => {
        if (!id) return;
        setDeleteLoading(true);
        try {
            const result = await ApiCaller<null, null>({
                requestType: "DELETE",
                paths: ["api", "v1", "hiring", "openings", id],
            });
            if (result.ok) {
                toast.success("Opening deleted");
                navigate("/hiring");
            } else {
                toast.error((result.response as any)?.message || "Failed to delete");
                setDeleteLoading(false);
            }
        } catch {
            toast.error("An error occurred");
            setDeleteLoading(false);
        }
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/job-opening/${id}`;
        navigator.clipboard.writeText(link).then(() => {
            setLinkCopied(true);
            toast.success("Link copied to clipboard");
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const editOpening = useCallback(async (title: string, description: string) => {
        if (!id) return;
        setEditLoading(true);
        try {
            const result = await ApiCaller<{ title: string; description: string }, Opening>({
                requestType: "PUT",
                paths: ["api", "v1", "hiring", "openings", id],
                body: { title, description },
            });
            if (result.ok) {
                setOpening((prev) => prev ? { ...prev, title, description } : prev);
                setEditDialogOpen(false);
                toast.success("Opening updated successfully");
            } else {
                toast.error((result.response as any)?.message || "Failed to update opening");
            }
        } catch {
            toast.error("An error occurred while updating the opening");
        } finally {
            setEditLoading(false);
        }
    }, [id]);

    const changeStatus = useCallback(async (status: "OPEN" | "CLOSED" | "PAUSED") => {
        if (!id) return;
        setStatusLoading(true);
        try {
            const result = await ApiCaller<{ Status: string }, Opening>({
                requestType: "PUT",
                paths: ["api", "v1", "hiring", "openings", id],
                body: { Status: status },
            });
            if (result.ok) {
                setOpening((prev) => prev ? { ...prev, Status: status } : prev);
                setStatusDialogOpen(false);
                toast.success(`Status changed to ${status}`);
            } else {
                toast.error((result.response as any)?.message || "Failed to update status");
            }
        } catch {
            toast.error("An error occurred while updating the status");
        } finally {
            setStatusLoading(false);
        }
    }, [id]);

    const filterApplicants = useCallback(async (type: "score" | "rank", value: number) => {
        if (!id) return;
        setFilterLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "openings", "filter", id],
                queryParams: {
                    filter: type,
                    value: type === "score" ? value / 100 : value,
                },
            });
            if (result.ok) {
                const modifiedCount = result.response.data?.modifiedCount ?? null;
                setFilterResult({
                    rejectedCount: modifiedCount,
                    message: result.response.message || "Filter applied successfully",
                });
                setFilterDialogOpen(false);
                setFilterResultDialogOpen(true);
                fetchApplicants();
            } else {
                toast.error((result.response as any)?.message || "Failed to apply filter");
            }
        } catch {
            toast.error("An error occurred while applying the filter");
        } finally {
            setFilterLoading(false);
        }
    }, [id, fetchApplicants]);

    const generateATS = useCallback(async () => {
        if (!id) return;
        setAtsLoading(true);
        setAtsResults(null);
        atsPollingRef.current = true;

        try {
            // Trigger ATS generation (also invalidates stale Redis cache server-side)
            const triggerResult = await ApiCaller<null, null>({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "applicants", "generate-ats", id],
            });

            if (!triggerResult.ok) {
                toast.error((triggerResult.response as any)?.message || "Failed to start ATS scoring");
                return;
            }

            toast.info("ATS scoring started, waiting for results...");

            // Long-poll — server blocks until worker publishes or 2-min timeout
            const pollResult = await ApiCaller<null, { status: string; results?: any[] }>({
                requestType: "GET",
                paths: ["api", "v1", "hiring", "applicants", "ats-result", id],
            });

            if (!atsPollingRef.current) return;

            if (pollResult.ok) {
                const data = pollResult.response.data;
                if (data.status === "ready" && data.results) {
                    setAtsResults(data.results);
                    toast.success("ATS scoring complete!");
                    fetchApplicants();
                } else {
                    toast.warning("ATS scoring timed out. Try again shortly.");
                }
            } else {
                toast.error("Failed to retrieve ATS results");
            }
        } catch {
            toast.error("An error occurred during ATS scoring");
        } finally {
            if (atsPollingRef.current) {
                setAtsLoading(false);
                atsPollingRef.current = false;
            }
        }
    }, [id, fetchApplicants]);

    // Cancel polling on unmount
    useEffect(() => {
        return () => {
            atsPollingRef.current = false;
        };
    }, []);

    return {
        // Opening
        opening,
        loading,
        error,
        // Delete
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        deleteLoading,
        handleDelete,
        // Link
        linkCopied,
        handleCopyLink,
        // Applicants
        applicantsList,
        applicantsLoading,
        applicantsError,
        currentPage,
        setCurrentPage,
        totalPages,
        totalCount,
        pageSize: PAGE_SIZE,
        // Filters
        statusFilter,
        setStatusFilter,
        roundFilter,
        setRoundFilter,
        // ATS
        atsLoading,
        atsResults,
        generateATS,
        // Filter
        filterDialogOpen,
        setFilterDialogOpen,
        filterLoading,
        filterApplicants,
        filterResultDialogOpen,
        setFilterResultDialogOpen,
        filterResult,
        // Edit
        editDialogOpen,
        setEditDialogOpen,
        editLoading,
        editOpening,
        // Status
        statusDialogOpen,
        setStatusDialogOpen,
        statusLoading,
        changeStatus,
    };
}
