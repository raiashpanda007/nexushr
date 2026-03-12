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

    const generateATS = useCallback(async () => {
        if (!id) return;
        setAtsLoading(true);
        setAtsResults(null);
        atsPollingRef.current = true;

        try {
            // Trigger ATS generation
            const triggerResult = await ApiCaller<null, null>({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "applicants", "generate-ats", id],
            });

            if (!triggerResult.ok) {
                toast.error((triggerResult.response as any)?.message || "Failed to start ATS scoring");
                setAtsLoading(false);
                atsPollingRef.current = false;
                return;
            }

            toast.info("ATS scoring started, waiting for results...");

            // Long-poll for results
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
                    // Refresh applicants list to show updated scores
                    fetchApplicants();
                } else {
                    toast.warning("ATS scoring is still in progress. Try again shortly.");
                }
            } else {
                toast.error("Failed to retrieve ATS results");
            }
        } catch {
            toast.error("An error occurred during ATS scoring");
        } finally {
            setAtsLoading(false);
            atsPollingRef.current = false;
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
    };
}
