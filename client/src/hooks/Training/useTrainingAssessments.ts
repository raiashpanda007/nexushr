import { useState, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";
import type {
    AssessmentFilter,
    MyAssessmentRow,
    PendingReviewRow,
    Assessment,
} from "@/types/training";

export function useTrainingAssessments() {
    // ── Tab 1: My Assessments (employee) ─────────────────────────────────────
    const [myAssessments, setMyAssessments] = useState<MyAssessmentRow[]>([]);
    const [myAssessmentsLoading, setMyAssessmentsLoading] = useState(false);
    const [filter, setFilter] = useState<AssessmentFilter>("all");

    const fetchMyAssessments = useCallback(async (f: AssessmentFilter = "all") => {
        setMyAssessmentsLoading(true);
        try {
            const queryParams: Record<string, string> = {};
            if (f !== "all") queryParams.filter = f;
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress", "my-assessments"],
                queryParams,
            });
            if (result.ok) {
                setMyAssessments(result.response.data ?? []);
            } else {
                toast.error(result.response.message || "Failed to fetch assessments");
            }
        } catch {
            toast.error("Failed to fetch assessments");
        } finally {
            setMyAssessmentsLoading(false);
        }
    }, []);

    const handleFilterChange = (f: AssessmentFilter) => {
        setFilter(f);
        fetchMyAssessments(f);
    };

    // ── Tab 2: Pending Reviews (HR) ───────────────────────────────────────────
    const [pendingReviews, setPendingReviews] = useState<PendingReviewRow[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    const fetchPendingReviews = useCallback(async () => {
        setPendingLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress", "pending-reviews"],
            });
            if (result.ok) {
                setPendingReviews(result.response.data ?? []);
            } else {
                toast.error(result.response.message || "Failed to fetch pending reviews");
            }
        } catch {
            toast.error("Failed to fetch pending reviews");
        } finally {
            setPendingLoading(false);
        }
    }, []);

    // ── Review modal state ────────────────────────────────────────────────────
    const [reviewTarget, setReviewTarget] = useState<PendingReviewRow | null>(null);
    const [reviewAssessment, setReviewAssessment] = useState<Assessment | null>(null);
    const [reviewAssessmentLoading, setReviewAssessmentLoading] = useState(false);

    const openReview = async (row: PendingReviewRow) => {
        setReviewTarget(row);
        setReviewAssessment(null);
        if (!row.assessmentId) return;
        setReviewAssessmentLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "assessments", row.assessmentId],
            });
            if (result.ok) {
                setReviewAssessment(result.response.data);
            } else {
                toast.error("Failed to load assessment questions");
            }
        } catch {
            toast.error("Failed to load assessment questions");
        } finally {
            setReviewAssessmentLoading(false);
        }
    };

    const closeReview = () => {
        setReviewTarget(null);
        setReviewAssessment(null);
    };

    // ── Submit review ─────────────────────────────────────────────────────────
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const submitReview = async (
        textScores: { questionId: string; score: number }[],
        note: string
    ): Promise<boolean> => {
        if (!reviewTarget) return false;
        setReviewSubmitting(true);
        try {
            const body: Record<string, unknown> = {
                userId: reviewTarget.userId,
                lessonId: reviewTarget.lessonId,
                chapterId: reviewTarget.chapterId,
                textScores,
            };
            if (note.trim()) body.note = note.trim();

            const result = await ApiCaller<any, any>({
                requestType: "PATCH",
                paths: ["api", "v1", "training", "progress", "review"],
                body,
            });
            if (result.ok) {
                toast.success("Review submitted successfully");
                closeReview();
                fetchPendingReviews();
                return true;
            } else {
                toast.error(result.response.message || "Failed to submit review");
                return false;
            }
        } catch {
            toast.error("Failed to submit review");
            return false;
        } finally {
            setReviewSubmitting(false);
        }
    };

    return {
        // My Assessments
        myAssessments,
        myAssessmentsLoading,
        filter,
        handleFilterChange,
        fetchMyAssessments,
        // Pending Reviews
        pendingReviews,
        pendingLoading,
        fetchPendingReviews,
        // Review modal
        reviewTarget,
        reviewAssessment,
        reviewAssessmentLoading,
        reviewSubmitting,
        openReview,
        closeReview,
        submitReview,
    };
}
