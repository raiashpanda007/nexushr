import { useState, useEffect, useRef } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";

interface TextResource {
    content: string;
}

interface VideoVersion {
    quality: "default";
    url: string;
}

interface VideoLecture {
    name: string;
    versions: VideoVersion[];
    metadata?: string;
}

export type QuestionType = "MCQ" | "TEXT";

export interface AssessmentQuestion {
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer: string;
    marks: number;
}

export interface ReviewerOption {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
}

export interface AssessmentDraft {
    name: string;
    passingScore: number;
    questions: AssessmentQuestion[];
    reviewer: ReviewerOption | null;
}

export interface CreateChapterFormData {
    name: string;
    description: string;
    textResources: TextResource[];
    linkResources: string[];
    pdfResources: string[];
    docxResources: string[];
    videoLecture: VideoLecture | null;
    assessment: AssessmentDraft;
}

export const TOTAL_STEPS = 4;

const INITIAL_FORM: CreateChapterFormData = {
    name: "",
    description: "",
    textResources: [],
    linkResources: [],
    pdfResources: [],
    docxResources: [],
    videoLecture: null,
    assessment: { name: "", passingScore: 70, questions: [], reviewer: null },
};

const BLANK_QUESTION: AssessmentQuestion = {
    question: "",
    type: "MCQ",
    options: ["", ""],
    correctAnswer: "",
    marks: 1,
};

const sessionKey = (lessonId: string) => `create-chapter:${lessonId}`;

const buildResourceNameFromUrl = (url: string, fallbackPrefix: string, index: number) => {
    const filename = url.split("?")[0].split("/").pop();
    if (filename && filename.trim().length >= 2) return filename.trim();
    return `${fallbackPrefix} ${index + 1}`;
};

const buildResourceNameFromLink = (link: string, index: number) => {
    try {
        const { hostname, pathname } = new URL(link);
        const tail = pathname.split("/").filter(Boolean).pop();
        const candidate = tail || hostname;
        if (candidate && candidate.trim().length >= 2) return candidate.trim();
    } catch {
        // ignore invalid URL, fallback below
    }
    return `Link ${index + 1}`;
};

export function useCreateChapter(lessonId: string) {
    const [step, setStep] = useState<number>(() => {
        try {
            const saved = sessionStorage.getItem(sessionKey(lessonId));
            return saved ? (JSON.parse(saved).step ?? 1) : 1;
        } catch {
            return 1;
        }
    });

    const [formData, setFormData] = useState<CreateChapterFormData>(() => {
        try {
            const saved = sessionStorage.getItem(sessionKey(lessonId));
            return saved ? { ...INITIAL_FORM, ...(JSON.parse(saved).formData ?? {}) } : INITIAL_FORM;
        } catch {
            return INITIAL_FORM;
        }
    });

    // Persist step + formData to sessionStorage on every change
    useEffect(() => {
        try {
            sessionStorage.setItem(sessionKey(lessonId), JSON.stringify({ step, formData }));
        } catch {
            // sessionStorage unavailable — silent fail
        }
    }, [step, formData, lessonId]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateChapterFormData, string>>>({});
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingDocx, setUploadingDocx] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // ── Reviewer search ───────────────────────────────────────────────────
    const [reviewerQuery, setReviewerQuery] = useState("");
    const [reviewerOptions, setReviewerOptions] = useState<ReviewerOption[]>([]);
    const [reviewerLoading, setReviewerLoading] = useState(false);
    const reviewerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (reviewerTimerRef.current) clearTimeout(reviewerTimerRef.current);
        if (!reviewerQuery.trim()) { setReviewerOptions([]); return; }
        reviewerTimerRef.current = setTimeout(async () => {
            setReviewerLoading(true);
            try {
                const res = await ApiCaller<{ query: string }, { data: ReviewerOption[] }>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "users"],
                    queryParams: { query: reviewerQuery.trim() },
                });
                if (res.ok) {
                    const all = (res.response.data as any)?.data ?? res.response.data ?? [];
                    setReviewerOptions((all as any[]).slice(0, 10));
                }
            } catch { /* ignore */ } finally {
                setReviewerLoading(false);
            }
        }, 300);
        return () => { if (reviewerTimerRef.current) clearTimeout(reviewerTimerRef.current); };
    }, [reviewerQuery]);

    const setReviewer = (reviewer: ReviewerOption | null) =>
        setFormData((prev) => ({
            ...prev,
            assessment: { ...prev.assessment, reviewer },
        }));

    // ── Basic field change ────────────────────────────────────────────────
    const handleBasicChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        setError(null);
    };

    // ── Text resources ────────────────────────────────────────────────────
    const addTextResource = () =>
        setFormData((prev) => ({
            ...prev,
            textResources: [...prev.textResources, { content: "" }],
        }));

    const updateTextResource = (idx: number, content: string) =>
        setFormData((prev) => {
            const updated = [...prev.textResources];
            updated[idx] = { content };
            return { ...prev, textResources: updated };
        });

    const removeTextResource = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            textResources: prev.textResources.filter((_, i) => i !== idx),
        }));

    // ── Link resources ────────────────────────────────────────────────────
    const addLinkResource = () =>
        setFormData((prev) => ({
            ...prev,
            linkResources: [...prev.linkResources, ""],
        }));

    const updateLinkResource = (idx: number, url: string) =>
        setFormData((prev) => {
            const updated = [...prev.linkResources];
            updated[idx] = url;
            return { ...prev, linkResources: updated };
        });

    const removeLinkResource = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            linkResources: prev.linkResources.filter((_, i) => i !== idx),
        }));

    // ── File upload (shared for resources) ───────────────────────────────
    const uploadFileToS3 = async (file: File, resourceType: "resource" | "video"): Promise<string> => {
        const signedResult = await ApiCaller<
            { fileName: string; contentType: string; resourceType: string },
            { signedUrl: string; key: string }
        >({
            requestType: "POST",
            paths: ["api", "v1", "training", "lessons", "signed-url"],
            body: { fileName: file.name, contentType: file.type, resourceType },
        });

        if (!signedResult.ok) throw new Error("Failed to get upload URL");
        const { signedUrl } = signedResult.response.data;

        const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
        });
        if (!uploadRes.ok) throw new Error("File upload failed");

        return signedUrl.split("?")[0];
    };

    // ── PDF resources ─────────────────────────────────────────────────────
    const handlePdfUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadingPdf(true);
        try {
            const urls: string[] = [];
            for (const file of Array.from(files)) {
                const url = await uploadFileToS3(file, "resource");
                urls.push(url);
            }
            setFormData((prev) => ({
                ...prev,
                pdfResources: [...prev.pdfResources, ...urls],
            }));
            toast.success(`${urls.length} PDF${urls.length > 1 ? "s" : ""} uploaded`);
        } catch (e: any) {
            setError(e.message ?? "PDF upload failed");
        } finally {
            setUploadingPdf(false);
        }
    };

    const removePdfResource = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            pdfResources: prev.pdfResources.filter((_, i) => i !== idx),
        }));

    // ── DOCX resources ────────────────────────────────────────────────────
    const handleDocxUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadingDocx(true);
        try {
            const urls: string[] = [];
            for (const file of Array.from(files)) {
                const url = await uploadFileToS3(file, "resource");
                urls.push(url);
            }
            setFormData((prev) => ({
                ...prev,
                docxResources: [...prev.docxResources, ...urls],
            }));
            toast.success(`${urls.length} DOCX file${urls.length > 1 ? "s" : ""} uploaded`);
        } catch (e: any) {
            setError(e.message ?? "DOCX upload failed");
        } finally {
            setUploadingDocx(false);
        }
    };

    const removeDocxResource = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            docxResources: prev.docxResources.filter((_, i) => i !== idx),
        }));

    // ── Video lecture ─────────────────────────────────────────────────────
    const handleVideoUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setUploadingVideo(true);
        try {
            const url = await uploadFileToS3(file, "video");
            setFormData((prev) => {
                const base = prev.videoLecture ?? { name: file.name, versions: [], metadata: "" };
                return {
                    ...prev,
                    videoLecture: {
                        ...base,
                        name: base.name || file.name,
                        versions: [{ quality: "default" as const, url }],
                    },
                };
            });
            toast.success("Video uploaded successfully");
        } catch (e: any) {
            setError(e.message ?? "Video upload failed");
        } finally {
            setUploadingVideo(false);
        }
    };

    const updateVideoField = (field: "name" | "url" | "metadata", value: string) => {
        setFormData((prev) => {
            const base = prev.videoLecture ?? {
                name: "",
                versions: [{ quality: "default" as const, url: "" }],
            };
            if (field === "name") return { ...prev, videoLecture: { ...base, name: value } };
            if (field === "metadata") return { ...prev, videoLecture: { ...base, metadata: value } };
            return {
                ...prev,
                videoLecture: {
                    ...base,
                    versions: [{ quality: "default" as const, url: value }],
                },
            };
        });
    };

    const clearVideoLecture = () =>
        setFormData((prev) => ({ ...prev, videoLecture: null }));

    // ── Assessment ────────────────────────────────────────────────────────
    const updateAssessmentField = (field: "name" | "passingScore", value: string | number) =>
        setFormData((prev) => ({
            ...prev,
            assessment: { ...prev.assessment, [field]: value },
        }));

    const addQuestion = () =>
        setFormData((prev) => ({
            ...prev,
            assessment: {
                ...prev.assessment,
                questions: [...prev.assessment.questions, { ...BLANK_QUESTION, options: ["", ""] }],
            },
        }));

    const removeQuestion = (idx: number) =>
        setFormData((prev) => ({
            ...prev,
            assessment: {
                ...prev.assessment,
                questions: prev.assessment.questions.filter((_, i) => i !== idx),
            },
        }));

    const updateQuestion = (idx: number, updates: Partial<AssessmentQuestion>) =>
        setFormData((prev) => {
            const questions = [...prev.assessment.questions];
            questions[idx] = { ...questions[idx], ...updates };
            // Reset MCQ-specific fields when switching to TEXT
            if (updates.type === "TEXT") {
                questions[idx].options = [];
                questions[idx].correctAnswer = "";
            }
            // Ensure at least 2 options when switching to MCQ
            if (updates.type === "MCQ" && questions[idx].options.length < 2) {
                questions[idx].options = ["", ""];
            }
            return { ...prev, assessment: { ...prev.assessment, questions } };
        });

    const addOption = (qIdx: number) =>
        setFormData((prev) => {
            const questions = [...prev.assessment.questions];
            questions[qIdx] = { ...questions[qIdx], options: [...questions[qIdx].options, ""] };
            return { ...prev, assessment: { ...prev.assessment, questions } };
        });

    const updateOption = (qIdx: number, oIdx: number, value: string) =>
        setFormData((prev) => {
            const questions = [...prev.assessment.questions];
            const oldValue = questions[qIdx].options[oIdx]; // capture BEFORE mutation
            const options = [...questions[qIdx].options];
            options[oIdx] = value;
            // If this option was the correct answer, track it to the new text
            const correctAnswer = questions[qIdx].correctAnswer === oldValue
                ? value
                : questions[qIdx].correctAnswer;
            questions[qIdx] = { ...questions[qIdx], options, correctAnswer };
            return { ...prev, assessment: { ...prev.assessment, questions } };
        });

    const removeOption = (qIdx: number, oIdx: number) =>
        setFormData((prev) => {
            const questions = [...prev.assessment.questions];
            const options = questions[qIdx].options.filter((_, i) => i !== oIdx);
            const correctAnswer = options.includes(questions[qIdx].correctAnswer)
                ? questions[qIdx].correctAnswer
                : "";
            questions[qIdx] = { ...questions[qIdx], options, correctAnswer };
            return { ...prev, assessment: { ...prev.assessment, questions } };
        });

    // ── Step navigation ───────────────────────────────────────────────────
    const validateStep1 = () => {
        const errs: Partial<Record<keyof CreateChapterFormData, string>> = {};
        if (!formData.name.trim()) errs.name = "Chapter name is required";
        if (!formData.description.trim()) errs.description = "Description is required";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const goNext = () => {
        if (step === 1 && !validateStep1()) {
            setError("Please fill in all required fields");
            return;
        }
        setError(null);
        setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    };

    const goBack = () => {
        setError(null);
        setStep((s) => Math.max(s - 1, 1));
    };

    // ── Session helpers ───────────────────────────────────────────────────
    const clearSession = () => {
        try { sessionStorage.removeItem(sessionKey(lessonId)); } catch { /* ignore */ }
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async (): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            // Create assessment if questions exist
            let assessmentIds: { assessmentId: string }[] = [];
            const { assessment } = formData;
            if (assessment.questions.length > 0) {
                if (!assessment.name.trim()) {
                    setError("Assessment name is required when questions are added");
                    return false;
                }
                const assessResult = await ApiCaller<any, any>({
                    requestType: "POST",
                    paths: ["api", "v1", "training", "assessments"],
                    body: {
                        name: assessment.name.trim(),
                        passingScore: assessment.passingScore,
                        questions: assessment.questions,
                        reviewer: assessment.reviewer?._id ?? null,
                    },
                });
                if (!assessResult.ok) {
                    setError((assessResult.response as any)?.message ?? "Failed to create assessment");
                    return false;
                }
                assessmentIds = [{ assessmentId: assessResult.response.data._id }];
            }

            // Only include video if both name and URL are present
            let videoPayload: VideoLecture | undefined;
            const vl = formData.videoLecture;
            if (vl?.name?.trim() && vl.versions?.[0]?.url?.trim()) {
                videoPayload = vl;
            }

            const pdfResources = formData.pdfResources.map((url, idx) => ({
                name: buildResourceNameFromUrl(url, "PDF", idx),
                url,
            }));

            const docxResources = formData.docxResources.map((url, idx) => ({
                name: buildResourceNameFromUrl(url, "DOCX", idx),
                url,
            }));

            const textResources = formData.textResources
                .map((t, idx) => ({
                    name: `Text ${idx + 1}`,
                    content: t.content.trim(),
                }))
                .filter((t) => t.content);

            const linkResources = formData.linkResources
                .map((link, idx) => ({
                    name: buildResourceNameFromLink(link, idx),
                    link: link.trim(),
                }))
                .filter((l) => l.link);

            const result = await ApiCaller<any, any>({
                requestType: "POST",
                paths: ["api", "v1", "training", "chapters"],
                body: {
                    lessonId,
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    pdfResources,
                    docxResources,
                    textResources,
                    linkResources,
                    videoLecture: videoPayload ?? null,
                    assessments: assessmentIds,
                },
            });

            if (!result.ok) {
                setError((result.response as any)?.message ?? "Failed to create chapter");
                return false;
            }
            clearSession();
            return true;
        } catch {
            setError("Failed to create chapter");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        step,
        formData,
        loading,
        error,
        fieldErrors,
        uploadingPdf,
        uploadingDocx,
        uploadingVideo,
        handleBasicChange,
        addTextResource,
        updateTextResource,
        removeTextResource,
        addLinkResource,
        updateLinkResource,
        removeLinkResource,
        handlePdfUpload,
        removePdfResource,
        handleDocxUpload,
        removeDocxResource,
        handleVideoUpload,
        updateVideoField,
        clearVideoLecture,
        updateAssessmentField,
        addQuestion,
        removeQuestion,
        updateQuestion,
        addOption,
        updateOption,
        removeOption,
        reviewerQuery,
        setReviewerQuery,
        reviewerOptions,
        reviewerLoading,
        setReviewer,
        goNext,
        goBack,
        handleSubmit,
        clearSession,
    };
}
