import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Assessment, Question } from "@/types/training";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Loader2,
    X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentViewProps {
    assessment: Assessment;
    lessonId: string;
    chapterId: string;
    onClose: (submitted?: boolean) => void;
}

type Answers = Record<string, string>;

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
            <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

// ─── Question card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
    question: Question;
    idx: number;
    answer: string;
    onAnswer: (ans: string) => void;
    disabled?: boolean;
}

function QuestionCard({ question, idx, answer, onAnswer, disabled }: QuestionCardProps) {
    return (
        <div className="rounded-2xl bg-card border border-border/50 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                </div>
                <div className="flex-1">
                    <p className="font-medium text-foreground leading-relaxed">
                        {question.question}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs">
                            {question.type === "MCQ" ? "Multiple Choice" : "Text Answer"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {question.marks} mark{question.marks !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            </div>

            {question.type === "MCQ" && question.options ? (
                <div className="flex flex-col gap-2 ml-10">
                    {question.options.map((opt, oIdx) => (
                        <button
                            key={oIdx}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && onAnswer(opt)}
                            className={cn(
                                "flex items-center gap-3 w-full text-left p-3.5 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                answer === opt
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border/50 hover:border-border hover:bg-muted/30 text-foreground",
                                disabled && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <div
                                className={cn(
                                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                    answer === opt ? "border-primary" : "border-muted-foreground/40"
                                )}
                            >
                                {answer === opt && (
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                            </div>
                            <span className="text-sm flex-1">{opt}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <Textarea
                    value={answer}
                    onChange={(e) => onAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    disabled={disabled}
                    className="ml-10 resize-none"
                />
            )}
        </div>
    );
}

// ─── Result screen (no score shown — pending review) ──────────────────────────

function ResultScreen({ forced, onClose }: { forced: boolean; onClose: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="max-w-md w-full text-center flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        {forced ? "Assessment Auto-Submitted" : "Assessment Submitted!"}
                    </h2>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                        {forced
                            ? "Your assessment was automatically submitted because you left the exam environment."
                            : "Your responses have been recorded and are pending review by HR."}
                    </p>
                </div>

                <div className="w-full bg-muted/50 rounded-2xl p-5 border border-border/50 flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground text-left">
                        Results will be shared with you once your submission has been reviewed.
                    </p>
                </div>

                <Button className="w-full" onClick={onClose}>
                    Continue
                </Button>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AssessmentView({
    assessment,
    lessonId,
    chapterId,
    onClose,
}: AssessmentViewProps) {
    const [answers, setAnswers] = useState<Answers>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [forcedSubmit, setForcedSubmit] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const autoSubmittedRef = useRef(false);

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = assessment.questions.length;
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    // ── Enter fullscreen on mount, exit on unmount ─────────────────────────
    useEffect(() => {
        document.documentElement.requestFullscreen?.().catch(() => {});
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
        };
    }, []);

    const submitAnswers = useCallback(
        async (forced = false) => {
            if (autoSubmittedRef.current) return;
            autoSubmittedRef.current = true;
            setSubmitting(true);
            if (forced) setForcedSubmit(true);

            const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
                questionId,
                answer,
            }));

            // No answers yet on forced submit — mark as submitted locally, skip API
            if (forced && answersArray.length === 0) {
                setSubmitted(true);
                setSubmitting(false);
                toast.warning("Assessment auto-submitted due to leaving the exam environment");
                return;
            }

            try {
                const res = await ApiCaller<any, any>({
                    requestType: "POST",
                    paths: ["api", "v1", "training", "progress", "submit"],
                    body: {
                        lessonId,
                        chapterId,
                        assessmentId: assessment._id,
                        answers: answersArray,
                    },
                });

                if (res.ok) {
                    setSubmitted(true);
                    if (forced) {
                        toast.warning("Assessment auto-submitted due to leaving the exam environment");
                    } else {
                        toast.success("Assessment submitted successfully!");
                    }
                } else {
                    toast.error((res.response as any)?.message ?? "Submission failed");
                    autoSubmittedRef.current = false;
                }
            } catch {
                toast.error("Submission failed. Please try again.");
                autoSubmittedRef.current = false;
            } finally {
                setSubmitting(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [answers, lessonId, chapterId, assessment._id]
    );

    // ── Anti-cheat: tab switch, app switch, fullscreen exit ────────────────
    useEffect(() => {
        const triggerViolation = () => {
            if (submitted || autoSubmittedRef.current) return;
            setWarningCount((prev) => {
                const next = prev + 1;
                if (next >= 2) {
                    submitAnswers(true);
                } else {
                    setShowWarning(true);
                    // Re-enter fullscreen on first warning
                    document.documentElement.requestFullscreen?.().catch(() => {});
                }
                return next;
            });
        };

        // Tab switch within browser
        const handleVisibilityChange = () => {
            if (document.hidden) triggerViolation();
        };

        // App switch / browser losing focus (Alt-Tab, clicking another app, etc.)
        const handleWindowBlur = () => triggerViolation();

        // Exiting fullscreen (Escape key or browser UI)
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) triggerViolation();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("blur", handleWindowBlur);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [submitted, submitAnswers]);

    const handleClose = () => {
        const exit = () => onClose(true);
        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {}).finally(exit);
        } else {
            exit();
        }
    };

    const content = submitted ? (
        <div className="fixed inset-0 z-9999 bg-background flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="border-b border-border/50 bg-card px-6 py-4 flex items-center gap-3 shrink-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">{assessment.name}</h2>
            </div>
            <ResultScreen forced={forcedSubmit} onClose={handleClose} />
        </div>
    ) : (
        <div className="fixed inset-0 z-9999 bg-background flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Warning banner */}
            {showWarning && (
                <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2 duration-300 shrink-0">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                        Warning: Leaving the exam environment will auto-submit your assessment.
                        ({2 - warningCount} warning{2 - warningCount !== 1 ? "s" : ""} remaining)
                    </span>
                    <button
                        className="ml-auto rounded p-0.5 hover:bg-amber-600 transition-colors"
                        onClick={() => setShowWarning(false)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-border/50 bg-card px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground">{assessment.name}</h2>
                        <p className="text-xs text-muted-foreground">
                            {answeredCount} / {totalQuestions} answered
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ProgressBar value={progress} />
                    <Badge variant="outline" className="text-xs shrink-0">
                        Pass: {assessment.passingScore ?? 70}%
                    </Badge>
                </div>
            </div>

            {/* Questions */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl mx-auto flex flex-col gap-5">
                    {assessment.questions.map((question, idx) => (
                        <QuestionCard
                            key={question._id}
                            question={question}
                            idx={idx}
                            answer={answers[question._id] ?? ""}
                            onAnswer={(ans) =>
                                setAnswers((prev) => ({ ...prev, [question._id]: ans }))
                            }
                            disabled={submitting}
                        />
                    ))}
                </div>
            </div>

            <Separator />

            {/* Footer */}
            <div className="bg-card px-6 py-4 flex items-center justify-between shrink-0">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    Leaving the exam environment will auto-submit your assessment
                </p>
                <Button
                    onClick={() => submitAnswers(false)}
                    disabled={submitting}
                    className="gap-2 min-w-36"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Submit Assessment
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

export type { AssessmentViewProps };
