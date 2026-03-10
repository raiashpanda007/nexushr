import { useState, useEffect, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Interview, Reviewer } from "@/types/hiring";
import type { Employee } from "@/types";
import { toast } from "sonner";

interface UseInterviewParams {
    applicantId: string;
    roundId: string | null;
    departmentId: string | null;
    onStatusChange?: () => void;
}

interface InterviewFormData {
    reviewers: Reviewer[];
    reviewDate: string;
    reviewTime: string;
    feedback: string;
}

const INITIAL_FORM: InterviewFormData = {
    reviewers: [],
    reviewDate: "",
    reviewTime: "",
    feedback: "",
};

export function useInterview({ applicantId, roundId, departmentId, onStatusChange }: UseInterviewParams) {
    const [interview, setInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<InterviewFormData>(INITIAL_FORM);

    // Reviewer search
    const [reviewerQuery, setReviewerQuery] = useState("");
    const [reviewerResults, setReviewerResults] = useState<Employee[]>([]);
    const [reviewerLoading, setReviewerLoading] = useState(false);
    const [isReviewerOpen, setIsReviewerOpen] = useState(false);

    // Fetch existing interview whenever roundId changes
    useEffect(() => {
        if (!applicantId || !roundId) {
            setInterview(null);
            setShowForm(false);
            return;
        }
        const fetch = async () => {
            setLoading(true);
            try {
                const result = await ApiCaller<null, { interview: Interview }>({
                    requestType: "GET",
                    paths: ["api", "v1", "hiring", "interviews"],
                    queryParams: { applicantId, roundId },
                });
                if (result.ok) {
                    setInterview(result.response.data.interview);
                    setShowForm(false);
                } else {
                    // 404 means no interview yet for this round
                    setInterview(null);
                }
            } catch {
                setInterview(null);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [applicantId, roundId]);

    // Reviewer search
    const searchReviewers = useCallback(
        async (q: string) => {
            if (!departmentId) return;
            setReviewerLoading(true);
            try {
                const queryParams: Record<string, string> = {
                    deptId: departmentId,
                };
                if (q.trim()) queryParams.query = q.trim();
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "employees"],
                    queryParams,
                });
                if (result.ok) {
                    const data = result.response.data;
                    const list = Array.isArray(data)
                        ? data
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];
                    // Exclude already-selected reviewers
                    const selectedIds = formData.reviewers.map((r) => r._id);
                    setReviewerResults(list.filter((e: Employee) => !selectedIds.includes(e._id)));
                }
            } finally {
                setReviewerLoading(false);
            }
        },
        [departmentId, formData.reviewers],
    );

    useEffect(() => {
        if (!departmentId) {
            setReviewerResults([]);
            return;
        }
        const tid = setTimeout(() => searchReviewers(reviewerQuery), 300);
        return () => clearTimeout(tid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviewerQuery, departmentId]);

    const addReviewer = (employee: Employee) => {
        const reviewer: Reviewer = {
            _id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
        };
        setFormData((prev) => ({ ...prev, reviewers: [...prev.reviewers, reviewer] }));
        setIsReviewerOpen(false);
        setReviewerQuery("");
    };

    const removeReviewer = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            reviewers: prev.reviewers.filter((r) => r._id !== id),
        }));
    };

    const handleFormChange = (field: keyof Omit<InterviewFormData, "reviewers">, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const openForm = () => {
        setFormData(INITIAL_FORM);
        setReviewerQuery("");
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setFormData(INITIAL_FORM);
    };

    const openEditForm = () => {
        if (!interview) return;
        const date = new Date(interview.reviewDate);
        const pad = (n: number) => String(n).padStart(2, "0");
        setFormData({
            reviewers: interview.reviewers,
            reviewDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
            reviewTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
            feedback: interview.feedback ?? "",
        });
        setIsEditing(true);
        setShowForm(true);
    };

    const createInterview = async () => {
        if (!roundId) return;
        if (formData.reviewers.length === 0) {
            toast.error("Please add at least one reviewer");
            return;
        }
        if (!formData.reviewDate) {
            toast.error("Please select a date");
            return;
        }
        if (!formData.reviewTime) {
            toast.error("Please select a time");
            return;
        }

        const reviewDate = new Date(`${formData.reviewDate}T${formData.reviewTime}`);

        if (reviewDate <= new Date()) {
            toast.error("Please select a future date and time");
            return;
        }

        setCreating(true);
        try {
            const result = await ApiCaller<object, { interview: Interview }>({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "interviews"],
                body: {
                    applicantId,
                    roundId,
                    reviewers: formData.reviewers.map((r) => r._id),
                    reviewDate: reviewDate.toISOString(),
                    feedback: formData.feedback || undefined,
                },
            });
            if (result.ok) {
                toast.success("Interview scheduled successfully");
                setInterview(result.response.data.interview);
                setShowForm(false);
            } else {
                toast.error(
                    (result.response as unknown as { message?: string })?.message ||
                    "Failed to schedule interview",
                );
            }
        } catch {
            toast.error("Failed to schedule interview");
        } finally {
            setCreating(false);
        }
    };

    const updateInterview = async () => {
        if (!interview) return;
        if (formData.reviewers.length === 0) {
            toast.error("Please add at least one reviewer");
            return;
        }
        if (!formData.reviewDate) {
            toast.error("Please select a date");
            return;
        }
        if (!formData.reviewTime) {
            toast.error("Please select a time");
            return;
        }

        const reviewDate = new Date(`${formData.reviewDate}T${formData.reviewTime}`);

        if (reviewDate <= new Date()) {
            toast.error("Please select a future date and time");
            return;
        }

        setCreating(true);
        try {
            const result = await ApiCaller<object, { interview: Interview }>({
                requestType: "PATCH",
                paths: ["api", "v1", "hiring", "interviews", interview._id],
                body: {
                    reviewers: formData.reviewers.map((r) => r._id),
                    reviewDate: reviewDate.toISOString(),
                    feedback: formData.feedback || undefined,
                },
            });
            if (result.ok) {
                toast.success("Interview updated successfully");
                setInterview(result.response.data.interview);
                setShowForm(false);
                setIsEditing(false);
            } else {
                toast.error(
                    (result.response as unknown as { message?: string })?.message ||
                    "Failed to update interview",
                );
            }
        } catch {
            toast.error("Failed to update interview");
        } finally {
            setCreating(false);
        }
    };

    const markResult = async (result: "PASSED" | "FAILED") => {
        if (!interview) return;
        setCreating(true);
        try {
            const res = await ApiCaller<object, { interview: Interview }>({
                requestType: "PATCH",
                paths: ["api", "v1", "hiring", "interviews", interview._id],
                body: { result },
            });
            if (res.ok) {
                toast.success(result === "PASSED" ? "Applicant passed" : "Applicant rejected");
                setInterview(res.response.data.interview);
                onStatusChange?.();
            } else {
                toast.error(
                    (res.response as unknown as { message?: string })?.message ||
                    "Failed to update result",
                );
            }
        } catch {
            toast.error("Failed to update result");
        } finally {
            setCreating(false);
        }
    };

    return {
        interview,
        loading,
        creating,
        showForm,
        isEditing,
        formData,
        reviewerQuery,
        setReviewerQuery,
        reviewerResults,
        reviewerLoading,
        isReviewerOpen,
        setIsReviewerOpen,
        addReviewer,
        removeReviewer,
        handleFormChange,
        openForm,
        openEditForm,
        cancelForm,
        createInterview,
        updateInterview,
        markResult,
    };
}
