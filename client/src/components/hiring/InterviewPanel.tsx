import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import {
    CalendarDays,
    Clock,
    Loader2,
    Plus,
    UserCircle2,
    X,
    CalendarCheck2,
    Users,
    MessageSquare,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInterview } from "@/hooks/hiring/useInterview";
import type { Round } from "@/types/hiring";

// ─── Status / Result badge helpers ───────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    SCHEDULED:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    COMPLETED:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    CANCELED:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const RESULT_STYLES: Record<string, string> = {
    PASSED:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    FAILED:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    PENDING:
        "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
};

const ResultIcon = ({ result }: { result: string }) => {
    if (result === "PASSED") return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (result === "FAILED") return <XCircle className="h-3.5 w-3.5" />;
    return <AlertCircle className="h-3.5 w-3.5" />;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface InterviewPanelProps {
    applicantId: string;
    round: Round;
    departmentId: string | null;
    onStatusChange?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InterviewPanel({
    applicantId,
    round,
    departmentId,
    onStatusChange,
}: InterviewPanelProps) {
    const {
        interview,
        loading,
        creating,
        showForm,
        isEditing,
        formData,
        markResult,
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
    } = useInterview({ applicantId, roundId: round._id, departmentId, onStatusChange });

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading interview details...</span>
            </div>
        );
    }

    // ── Interview exists ─────────────────────────────────────────────────────
    if (interview && !showForm) {
        const date = new Date(interview.reviewDate);
        const dateStr = date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const timeStr = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });

        return (
            <div className="flex flex-col gap-4">
                {/* Status row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                        variant="outline"
                        className={cn("text-xs border", STATUS_STYLES[interview.status])}
                    >
                        {interview.status}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs border flex items-center gap-1",
                            RESULT_STYLES[interview.result],
                        )}
                    >
                        <ResultIcon result={interview.result} />
                        {interview.result}
                    </Badge>
                    <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto gap-1.5 text-xs"
                        onClick={openEditForm}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </Button>
                </div>

                {/* Pass / Reject — shown when interview date has passed and result is still pending */}
                {new Date(interview.reviewDate) < new Date() &&
                    interview.result === "PENDING" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                            <p className="text-xs text-muted-foreground flex-1">
                                Interview date has passed. Mark the outcome:
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                                disabled={creating}
                                onClick={() => markResult("PASSED")}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Pass
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                disabled={creating}
                                onClick={() => markResult("FAILED")}
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                            </Button>
                        </div>
                    )}

                {/* Date & time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Date
                            </p>
                            <p className="text-sm font-medium text-foreground">{dateStr}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Time
                            </p>
                            <p className="text-sm font-medium text-foreground">{timeStr}</p>
                        </div>
                    </div>
                </div>

                {/* Reviewers */}
                {interview.reviewers.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Reviewers
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {interview.reviewers.map((r) => (
                                <div
                                    key={r._id}
                                    className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-lg px-3 py-1.5"
                                >
                                    <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs font-medium text-foreground">
                                        {r.firstName && r.lastName
                                            ? `${r.firstName} ${r.lastName}`
                                            : r.name ?? r.email}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {interview.feedback && (
                    <>
                        <Separator />
                        <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                                    Notes / Feedback
                                </p>
                                <p className="text-sm text-foreground leading-relaxed">
                                    {interview.feedback}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── No interview yet ─────────────────────────────────────────────────────
    if (!interview && !showForm) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        No interview scheduled for this round yet
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Schedule one to track reviewer assignments and results
                    </p>
                </div>
                <Button size="sm" className="gap-2 mt-1" onClick={openForm}>
                    <Plus className="h-4 w-4" />
                    Schedule Interview
                </Button>
            </div>
        );
    }

    // ── Create / Edit form ───────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                    {isEditing ? `Edit Interview — ${round.name}` : `Schedule Interview — ${round.name}`}
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={cancelForm}
                >
                    Cancel
                </Button>
            </div>

            <Separator />

            {/* Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="interview-date" className="text-xs font-medium">
                        Date
                    </Label>
                    <Input
                        id="interview-date"
                        type="date"
                        value={formData.reviewDate}
                        onChange={(e) => handleFormChange("reviewDate", e.target.value)}
                        className="text-sm"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="interview-time" className="text-xs font-medium">
                        Time
                    </Label>
                    <Input
                        id="interview-time"
                        type="time"
                        value={formData.reviewTime}
                        onChange={(e) => handleFormChange("reviewTime", e.target.value)}
                        className="text-sm"
                    />
                </div>
            </div>



            {/* Reviewers */}
            <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Reviewers</Label>

                {formData.reviewers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                        {formData.reviewers.map((r) => (
                            <div
                                key={r._id}
                                className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1 text-xs font-medium"
                            >
                                <UserCircle2 className="h-3 w-3 shrink-0" />
                                {r.firstName && r.lastName
                                    ? `${r.firstName} ${r.lastName}`
                                    : r.email}
                                <button
                                    type="button"
                                    onClick={() => removeReviewer(r._id)}
                                    className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                                    aria-label="Remove reviewer"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <Popover open={isReviewerOpen} onOpenChange={setIsReviewerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs w-full sm:w-auto justify-start"
                            disabled={!departmentId}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {departmentId ? "Add Reviewer" : "Department required"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-72" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Search employees..."
                                value={reviewerQuery}
                                onValueChange={setReviewerQuery}
                            />
                            <CommandList>
                                {reviewerLoading ? (
                                    <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground text-xs">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Searching...
                                    </div>
                                ) : (
                                    <>
                                        <CommandEmpty>No employees found</CommandEmpty>
                                        <CommandGroup>
                                            {reviewerResults.map((emp) => (
                                                <CommandItem
                                                    key={emp._id}
                                                    onSelect={() => addReviewer(emp)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <UserCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium">
                                                            {emp.firstName} {emp.lastName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {emp.email}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Feedback */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="interview-feedback" className="text-xs font-medium">
                    Notes / Feedback{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                    id="interview-feedback"
                    placeholder="Any notes or context for the reviewers..."
                    value={formData.feedback}
                    onChange={(e) => handleFormChange("feedback", e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <Button
                    className="gap-2"
                    onClick={isEditing ? updateInterview : createInterview}
                    disabled={creating}
                >
                    {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEditing ? (
                        <Pencil className="h-4 w-4" />
                    ) : (
                        <CalendarCheck2 className="h-4 w-4" />
                    )}
                    {creating
                        ? isEditing ? "Saving..." : "Scheduling..."
                        : isEditing ? "Save Changes" : "Schedule Interview"}
                </Button>
            </div>
        </div>
    );
}
