import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    CalendarCheck2,
    Loader2,
    Building2,
    CalendarDays,
    Clock,
    Users,
    UserCircle2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Inbox,
    Video,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMyReviews } from "@/hooks/hiring/useMyReviews";
import type { MyInterview, Reviewer } from "@/types/hiring";

// ─── Style maps ───────────────────────────────────────────────────────────────

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

const ROUND_TYPE_STYLES: Record<string, string> = {
    INTERVIEW:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    TEST: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    ASSIGNMENT:
        "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
};

const ResultIcon = ({ result }: { result: string }) => {
    if (result === "PASSED") return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (result === "FAILED") return <XCircle className="h-3.5 w-3.5" />;
    return <AlertCircle className="h-3.5 w-3.5" />;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReviewerName(r: Reviewer): string {
    if (r.firstName && r.lastName) return `${r.firstName} ${r.lastName}`;
    if (r.name) return r.name;
    return r.email;
}

function getRoundName(roundId: MyInterview["roundId"]): string {
    if (typeof roundId === "object" && roundId !== null) return roundId.name;
    return "—";
}

function getRoundType(roundId: MyInterview["roundId"]): string | null {
    if (typeof roundId === "object" && roundId !== null) return roundId.type;
    return null;
}

function getApplicantName(applicantId: MyInterview["applicantId"]): string {
    if (typeof applicantId === "object" && applicantId !== null) return applicantId.name;
    return "—";
}

function getOpeningTitle(opening: MyInterview["opening"]): string {
    if (!opening) return "—";
    return opening.title;
}

function getDeptName(opening: MyInterview["opening"]): string {
    if (!opening) return "—";
    if (typeof opening.departmentId === "object" && opening.departmentId !== null) {
        return opening.departmentId.name;
    }
    return "—";
}

// ─── Interview card ───────────────────────────────────────────────────────────

interface InterviewCardProps {
    interview: MyInterview;
    onMarkResult: (id: string, result: "PASSED" | "FAILED") => Promise<void>;
    isMarking: boolean;
}

function InterviewCard({ interview, onMarkResult, isMarking }: InterviewCardProps) {
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

    const roundType = getRoundType(interview.roundId);

    return (
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="px-4 py-4 sm:px-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-base font-semibold text-foreground leading-tight">
                            {getApplicantName(interview.applicantId)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {getOpeningTitle(interview.opening)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
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
                    </div>
                </div>

                <Separator className="my-3" />

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Round */}
                    <div className="flex items-center gap-2">
                        <CalendarCheck2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Round
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-sm font-medium text-foreground">
                                    {getRoundName(interview.roundId)}
                                </span>
                                {roundType && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] border py-0",
                                            ROUND_TYPE_STYLES[roundType] ??
                                                "bg-muted text-muted-foreground border-border",
                                        )}
                                    >
                                        {roundType}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Department
                            </p>
                            <p className="text-sm font-medium text-foreground mt-0.5">
                                {getDeptName(interview.opening)}
                            </p>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Date
                            </p>
                            <p className="text-sm font-medium text-foreground mt-0.5">{dateStr}</p>
                        </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Time
                            </p>
                            <p className="text-sm font-medium text-foreground mt-0.5">{timeStr}</p>
                        </div>
                    </div>
                </div>

                {/* Reviewers */}
                {interview.reviewers.length > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Reviewers
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {interview.reviewers.map((r) => (
                                <div
                                    key={r._id}
                                    className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1"
                                >
                                    <UserCircle2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="text-xs font-medium text-foreground">
                                        {getReviewerName(r)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pass / Reject — shown when interview date has passed and result is PENDING */}
                {new Date(interview.reviewDate) < new Date() &&
                    interview.result === "PENDING" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                            <p className="text-xs text-muted-foreground flex-1">
                                Interview time has passed. Mark the outcome:
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                                disabled={isMarking}
                                onClick={() => onMarkResult(interview._id, "PASSED")}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Pass
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                disabled={isMarking}
                                onClick={() => onMarkResult(interview._id, "FAILED")}
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                            </Button>
                        </div>
                    )}

                {/* Zoom link */}
                {interview.zoomJoinUrl && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <Video className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                                Zoom Meeting
                            </p>
                            <a
                                href={interview.zoomJoinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline truncate block"
                            >
                                {interview.zoomJoinUrl}
                            </a>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTERS = [
    { value: "UPCOMING" as const, label: "Upcoming" },
    { value: "ALL" as const, label: "All" },
    { value: "COMPLETED" as const, label: "Past" },
];

export default function Reviews() {
    const { interviews, allInterviews, loading, filter, setFilter, markResult, markingId } = useMyReviews();
    const [activeMark, setActiveMark] = useState<string | null>(null);

    const handleMarkResult = async (id: string, result: "PASSED" | "FAILED") => {
        setActiveMark(id);
        await markResult(id, result);
        setActiveMark(null);
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 px-2 sm:px-3">
            {/* Page header */}
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                <div className="relative px-5 py-5 bg-card">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <CalendarCheck2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground tracking-tight">
                                    My Reviews
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Interviews where you are a reviewer or hiring manager
                                </p>
                            </div>
                        </div>
                        {!loading && (
                            <Badge variant="secondary" className="text-sm">
                                {allInterviews.length} total
                            </Badge>
                        )}
                    </div>
                </div>
            </Card>

            {/* Filter bar */}
            <div className="flex gap-2">
                {FILTERS.map((f) => (
                    <Button
                        key={f.value}
                        variant={filter === f.value ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "text-xs transition-all",
                            filter === f.value && "shadow-md shadow-primary/20",
                        )}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-base font-medium text-muted-foreground animate-pulse">
                        Loading your interviews...
                    </p>
                </div>
            ) : interviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Inbox className="h-12 w-12 text-muted-foreground/30" />
                    <div className="text-center">
                        <p className="text-base font-medium text-muted-foreground">
                            No interviews found
                        </p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                            {filter === "UPCOMING"
                                ? "You have no upcoming scheduled interviews"
                                : "No interviews match the selected filter"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {interviews.map((iv) => (
                        <InterviewCard
                            key={iv._id}
                            interview={iv}
                            onMarkResult={handleMarkResult}
                            isMarking={activeMark === iv._id || markingId === iv._id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
