import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, ClipboardCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { PendingReviewRow, Assessment } from "@/types/training";

interface ReviewModalProps {
    row: PendingReviewRow;
    assessment: Assessment | null;
    assessmentLoading: boolean;
    submitting: boolean;
    onClose: () => void;
    onSubmit: (scores: { questionId: string; score: number }[], note: string) => void;
}

export default function ReviewModal({
    row,
    assessment,
    assessmentLoading,
    submitting,
    onClose,
    onSubmit,
}: ReviewModalProps) {
    const [scores, setScores] = useState<Record<string, string>>({});
    const [note, setNote] = useState("");

    const answersMap = new Map(row.answers.map((a) => [a.questionId, a.answer]));

    const textQuestions = assessment
        ? assessment.questions.filter((q) => q.type === "TEXT")
        : [];

    const handleScoreChange = (questionId: string, value: string) => {
        setScores((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = () => {
        if (!assessment) return;

        const textScores: { questionId: string; score: number }[] = [];
        for (const q of textQuestions) {
            const raw = scores[q._id];
            const parsed = parseFloat(raw ?? "0");
            if (isNaN(parsed) || parsed < 0 || parsed > q.marks) {
                return; // validation handled inline
            }
            textScores.push({ questionId: q._id, score: parsed });
        }
        onSubmit(textScores, note);
    };

    const allScored = textQuestions.every((q) => {
        const v = scores[q._id];
        if (v === undefined || v === "") return false;
        const n = parseFloat(v);
        return !isNaN(n) && n >= 0 && n <= q.marks;
    });

    const content = (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground leading-tight">Review Submission</p>
                            <p className="text-xs text-muted-foreground">{row.chapterName} · {row.lessonName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Employee info */}
                <div className="px-6 py-3 bg-muted/30 border-b border-border/40 flex items-center gap-3 shrink-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{row.firstName} {row.lastName}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-xs font-medium">{row.attemptedAt ? format(new Date(row.attemptedAt), "MMM d, yyyy · hh:mm a") : "—"}</p>
                    </div>
                    {row.mcqScore !== undefined && (
                        <div className="text-right shrink-0 border-l border-border/40 pl-4 ml-2">
                            <p className="text-xs text-muted-foreground">MCQ Score</p>
                            <p className="text-xs font-medium">{row.mcqScore} / {row.totalScore} pts</p>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {assessmentLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : textQuestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-5">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="text-center max-w-sm">
                                <p className="text-sm font-medium text-foreground">Auto-Graded Assessment</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This assessment contains only multiple-choice questions. Review the score and submit to approve.
                                </p>
                            </div>
                            <div className="w-full max-w-sm mt-2">
                                <p className="text-sm font-medium text-foreground mb-2 text-left">Reviewer Note <span className="text-muted-foreground font-normal">(optional)</span></p>
                                <Textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add feedback for the employee…"
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {textQuestions.map((q, idx) => {
                                const answer = answersMap.get(q._id) ?? "";
                                const scoreVal = scores[q._id] ?? "";
                                const parsedScore = parseFloat(scoreVal);
                                const hasError = scoreVal !== "" && (isNaN(parsedScore) || parsedScore < 0 || parsedScore > q.marks);

                                return (
                                    <div key={q._id} className="rounded-xl border border-border/50 overflow-hidden">
                                        {/* Question */}
                                        <div className="px-4 py-3 bg-muted/30 flex items-start gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-primary">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">{q.question}</p>
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    Text Answer · {q.marks} mark{q.marks !== 1 ? "s" : ""}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Employee's answer */}
                                        <div className="px-4 py-3 border-t border-border/30">
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Employee's Answer</p>
                                            <div className="rounded-lg bg-muted/20 border border-border/30 px-3 py-2.5 text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                                                {answer || <span className="text-muted-foreground italic">No answer provided</span>}
                                            </div>
                                        </div>

                                        {/* Score input */}
                                        <div className="px-4 py-3 border-t border-border/30 flex items-center gap-3">
                                            <p className="text-sm font-medium flex-1">Score</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={q.marks}
                                                    step={0.5}
                                                    value={scoreVal}
                                                    onChange={(e) => handleScoreChange(q._id, e.target.value)}
                                                    placeholder="0"
                                                    className={`w-20 text-center rounded-lg border px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${hasError ? "border-destructive" : "border-border/60"}`}
                                                />
                                                <span className="text-sm text-muted-foreground">/ {q.marks}</span>
                                            </div>
                                            {hasError && (
                                                <p className="text-xs text-destructive">0–{q.marks}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Reviewer note */}
                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">Reviewer Note <span className="text-muted-foreground font-normal">(optional)</span></p>
                                <Textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add feedback for the employee…"
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || assessmentLoading || (textQuestions.length > 0 && !allScored)}
                        className="gap-2 min-w-36"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Submit Review
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
