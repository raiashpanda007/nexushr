import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ApiCaller from "@/utils/ApiCaller";
import type { Opening, Question } from "@/types/hiring";
import { useAppSelector } from "@/store/hooks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
    Loader2,
    CheckCircle2,
    ChevronRight,
    Upload,
    AlertCircle,
    Building2,
    Users,
    BriefcaseBusiness,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasicDetails {
    name: string;
    email: string;
    phone: string;
    resumeFile: File | null;
    resumeUrl: string;
}

interface QuestionAnswer {
    questionId: string;
    answer: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDeptName(dep: Opening["departmentId"]): string {
    if (!dep) return "—";
    return typeof dep === "object" ? dep.name : "—";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                            i + 1 < current
                                ? "border-primary bg-primary text-primary-foreground"
                                : i + 1 === current
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-muted bg-transparent text-muted-foreground",
                        )}
                    >
                        {i + 1 < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span
                        className={cn(
                            "text-sm font-medium",
                            i + 1 === current ? "text-foreground" : "text-muted-foreground",
                        )}
                    >
                        {i === 0 ? "Basic Details" : "Questions"}
                    </span>
                    {i < total - 1 && (
                        <div
                            className={cn(
                                "h-px w-8 transition-all duration-300",
                                i + 1 < current ? "bg-primary" : "bg-border",
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobApply() {
    const { id } = useParams<{ id: string }>();
    const { userDetails } = useAppSelector((s) => s.userState);

    const [opening, setOpening] = useState<Opening | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // steps: 1 = basic details, 2 = questions (if any), "success" = submitted
    const [step, setStep] = useState<1 | 2 | "success">(1);

    // Step 1 state
    const [basic, setBasic] = useState<BasicDetails>({
        name: "",
        email: "",
        phone: "",
        resumeFile: null,
        resumeUrl: "",
    });
    const [uploadState, setUploadState] = useState<
        "idle" | "uploading" | "done" | "error"
    >("idle");
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 2 state
    const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // ── Fetch opening ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            setFetchError(null);
            const result = await ApiCaller<null, Opening>({
                requestType: "GET",
                paths: ["api", "v1", "hiring", "openings", "public", id],
                retry: false,
            });
            if (result.ok) {
                setOpening(result.response.data);
                // Pre-populate answer slots
                const qs = result.response.data.questions ?? [];
                setAnswers(qs.map((q) => ({ questionId: q._id, answer: "" })));
            } else {
                setFetchError(
                    result.response.message || "Failed to load opening details.",
                );
            }
            setLoading(false);
        })();
    }, [id]);

    // ── Resume upload ─────────────────────────────────────────────────────────
    async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setUploadError("Only PDF files are accepted.");
            return;
        }

        setBasic((prev) => ({ ...prev, resumeFile: file, resumeUrl: "" }));
        setUploadError("");
        setUploadState("uploading");

        try {
            // 1. Get signed URL
            const signedResult = await ApiCaller<
                { fileName: string; contentType: string },
                { signedUrl: string }
            >({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "applicants", "signed-url"],
                body: { fileName: file.name, contentType: file.type },
                retry: false,
            });

            if (!signedResult.ok) {
                throw new Error(
                    signedResult.response.message || "Failed to get upload URL",
                );
            }

            const { signedUrl } = signedResult.response.data;

            // 2. Upload directly to S3
            await axios.put(signedUrl, file, {
                headers: { "Content-Type": file.type },
                withCredentials: false,
            });

            // 3. Strip query params → clean S3 URL
            const cleanUrl = signedUrl.split("?")[0];
            setBasic((prev) => ({ ...prev, resumeUrl: cleanUrl }));
            setUploadState("done");
        } catch (err: any) {
            setUploadState("error");
            setUploadError(err?.message || "Upload failed. Please try again.");
        }
    }

    // ── Step 1 validation ─────────────────────────────────────────────────────
    function validateBasic(): string | null {
        if (!basic.name.trim()) return "Name is required.";
        if (!basic.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basic.email))
            return "A valid email is required.";
        if (!basic.phone.trim() || !/^[0-9]{10}$/.test(basic.phone))
            return "Phone number must be exactly 10 digits with no spaces or special characters.";
        if (!basic.resumeUrl) return "Please upload your resume (PDF).";
        return null;
    }

    function handleNextStep() {
        const err = validateBasic();
        if (err) {
            setSubmitError(err);
            return;
        }
        setSubmitError("");

        const hasQuestions = (opening?.questions?.length ?? 0) > 0;
        if (hasQuestions) {
            setStep(2);
        } else {
            handleSubmit();
        }
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit() {
        setSubmitting(true);
        setSubmitError("");

        const payload: any = {
            name: basic.name.trim(),
            email: basic.email.trim(),
            phone: basic.phone.trim(),
            openingId: id,
            resumeUrl: basic.resumeUrl,
        };

        if (answers.length > 0) {
            const unanswered = answers.find((a) => !a.answer.trim());
            if (unanswered) {
                setSubmitError("Please answer all questions before submitting.");
                setSubmitting(false);
                return;
            }
            payload.questions = answers;
        }

        const result = await ApiCaller<typeof payload, { applicantId: string }>({
            requestType: "POST",
            paths: ["api", "v1", "hiring", "applicants"],
            body: payload,
            retry: false,
        });

        if (result.ok) {
            setStep("success");
        } else {
            setSubmitError(
                result.response.message || "Submission failed. Please try again.",
            );
        }
        setSubmitting(false);
    }

    // ── Render: loading ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Render: error ─────────────────────────────────────────────────────────
    if (fetchError || !opening) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground">
                    Opening not found
                </h2>
                <p className="text-muted-foreground max-w-sm">
                    {fetchError ||
                        "This job opening may no longer exist or the link is invalid."}
                </p>
            </div>
        );
    }

    const isClosed = opening.Status !== "OPEN";
    const hasQuestions = (opening.questions?.length ?? 0) > 0;
    const totalSteps = hasQuestions ? 2 : 1;

    // ── Render: closed opening ────────────────────────────────────────────────
    if (isClosed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-4">
                <BriefcaseBusiness className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                    This position is no longer accepting applications
                </h2>
                <p className="text-muted-foreground max-w-sm">
                    The&nbsp;<span className="font-medium text-foreground">{opening.title}</span>&nbsp;
                    opening is currently&nbsp;
                    <span className="capitalize font-medium text-foreground">
                        {opening.Status.toLowerCase()}
                    </span>.
                </p>
            </div>
        );
    }

    // ── Render: success ───────────────────────────────────────────────────────
    if (step === "success") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-center px-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                        Application submitted!
                    </h2>
                    <p className="text-muted-foreground max-w-sm">
                        Thank you for applying for&nbsp;
                        <span className="font-medium text-foreground">{opening.title}</span>.
                        We'll review your application and be in touch.
                    </p>
                </div>
            </div>
        );
    }

    // ── Render: employee guard ────────────────────────────────────────────────
    const employeeBanner = userDetails ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
                You're currently signed in as an employee.&nbsp;
                <Link
                    to="/hiring"
                    className="underline underline-offset-2 hover:text-yellow-500 font-medium"
                >
                    Apply internally via the HR portal
                </Link>
                &nbsp;instead.
            </span>
        </div>
    ) : null;

    // ── Render: main form ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* ── Top bar ── */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10">
                <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        NexusHR
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {getDeptName(opening.departmentId)}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-10">
                {employeeBanner}

                {/* ── Opening info ── */}
                <div className="mb-8 space-y-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Open Position
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {opening.title}
                    </h1>
                    {opening.description && (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {opening.description}
                        </p>
                    )}
                </div>

                {/* ── Form card ── */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 p-6 sm:p-8">
                    {/* Step indicator – only shown when there are 2 steps */}
                    {hasQuestions && (
                        <StepIndicator current={step as number} total={totalSteps} />
                    )}

                    {/* ────────── STEP 1: Basic Details ────────── */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Your details
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Tell us a bit about yourself.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Jane Doe"
                                        value={basic.name}
                                        onChange={(e) =>
                                            setBasic((p) => ({ ...p, name: e.target.value }))
                                        }
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={basic.email}
                                        onChange={(e) =>
                                            setBasic((p) => ({ ...p, email: e.target.value }))
                                        }
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">Phone number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        value={basic.phone}
                                        onChange={(e) =>
                                            setBasic((p) => ({ ...p, phone: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            {/* Resume upload */}
                            <div className="space-y-1.5">
                                <Label>Resume (PDF only)</Label>
                                <div
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors cursor-pointer",
                                        uploadState === "done"
                                            ? "border-green-500/40 bg-green-500/5"
                                            : uploadState === "error"
                                                ? "border-destructive/40 bg-destructive/5"
                                                : "border-border hover:border-primary/40 hover:bg-accent/30",
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={handleResumeChange}
                                    />

                                    {uploadState === "uploading" ? (
                                        <>
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">
                                                Uploading your resume…
                                            </p>
                                        </>
                                    ) : uploadState === "done" ? (
                                        <>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    {basic.resumeFile?.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Click to replace
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                                                <Upload className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-foreground">
                                                    Click to upload your resume
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    PDF files only · Max 10 MB
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {uploadError && (
                                    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {uploadError}
                                    </p>
                                )}
                            </div>

                            {/* Inline error */}
                            {submitError && (
                                <p className="flex items-center gap-1.5 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {submitError}
                                </p>
                            )}

                            {/* Action */}
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleNextStep}
                                    disabled={submitting || uploadState === "uploading"}
                                    className="gap-2 px-6"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : hasQuestions ? (
                                        <>
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ────────── STEP 2: Questions ────────── */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Application questions
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Please answer all questions thoughtfully.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {opening.questions.map((q: Question, idx: number) => {
                                    const current = answers.find(
                                        (a) => a.questionId === q._id,
                                    );
                                    const setValue = (val: string) =>
                                        setAnswers((prev) =>
                                            prev.map((a) =>
                                                a.questionId === q._id ? { ...a, answer: val } : a,
                                            ),
                                        );

                                    return (
                                        <div key={q._id} className="space-y-2">
                                            <Label className="text-sm font-medium leading-snug">
                                                <span className="text-primary mr-1.5">
                                                    {idx + 1}.
                                                </span>
                                                {q.questionText}
                                            </Label>

                                            {q.questionType === "MULTIPLE_CHOICE" &&
                                            q.options?.length > 0 ? (
                                                <div className="grid gap-2 pt-1">
                                                    {q.options.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setValue(opt)}
                                                            className={cn(
                                                                "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                                                                current?.answer === opt
                                                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                                                    : "border-border hover:border-primary/40 hover:bg-accent/30 text-foreground",
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                                                                    current?.answer === opt
                                                                        ? "border-primary bg-primary"
                                                                        : "border-muted-foreground",
                                                                )}
                                                            >
                                                                {current?.answer === opt && (
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                                )}
                                                            </span>
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Textarea
                                                    placeholder="Your answer…"
                                                    rows={3}
                                                    value={current?.answer ?? ""}
                                                    onChange={(e) => setValue(e.target.value)}
                                                    className="resize-none"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Inline error */}
                            {submitError && (
                                <p className="flex items-center gap-1.5 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {submitError}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setStep(1);
                                        setSubmitError("");
                                    }}
                                    className="gap-1.5 text-muted-foreground"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="gap-2 px-6"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Submit Application"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer note ── */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    By submitting your application you agree to our processing of your
                    personal data for recruitment purposes.
                </p>
            </main>
        </div>
    );
}
