import { useEffect } from "react";
import {
    ClipboardCheck,
    Loader2,
    CheckCircle2,
    Clock,
    BookOpen,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";
import { useTrainingAssessments } from "@/hooks/Training/useTrainingAssessments";
import ReviewModal from "@/components/training/ReviewModal";
import type { AssessmentFilter, MyAssessmentRow, PendingReviewRow } from "@/types/training";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
> = {
    reviewed: {
        label: "Reviewed",
        className: "bg-emerald-500/15 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20",
        icon: CheckCircle2,
    },
    pending_review: {
        label: "Pending Review",
        className: "bg-amber-500/15 text-amber-600 border-amber-200 hover:bg-amber-500/20",
        icon: Clock,
    },
    not_attempted: {
        label: "Not Attempted",
        className: "",
        icon: BookOpen,
    },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? statusConfig.not_attempted;
    return (
        <Badge className={cfg.className || undefined} variant={cfg.className ? undefined : "secondary"}>
            {cfg.label}
        </Badge>
    );
}

// ─── My Assessments Tab ───────────────────────────────────────────────────────

function MyAssessmentsTab({
    rows,
    loading,
    filter,
    onFilterChange,
}: {
    rows: MyAssessmentRow[];
    loading: boolean;
    filter: AssessmentFilter;
    onFilterChange: (f: AssessmentFilter) => void;
}) {
    const reviewed = rows.filter((r) => r.status === "reviewed").length;
    const pending = rows.filter((r) => r.status === "pending_review").length;
    const notAttempted = rows.filter((r) => r.status === "not_attempted").length;

    return (
        <div className="flex flex-col gap-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reviewed</p>
                            <p className="text-2xl font-bold text-foreground">{reviewed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending Review</p>
                            <p className="text-2xl font-bold text-foreground">{pending}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Not Attempted</p>
                            <p className="text-2xl font-bold text-foreground">{notAttempted}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter + table */}
            <Card className="border-border/40">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold">Assessments</CardTitle>
                    <Select value={filter} onValueChange={(v) => onFilterChange(v as AssessmentFilter)}>
                        <SelectTrigger className="w-44 h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="pending_review">Pending Review</SelectItem>
                            <SelectItem value="not_attempted">Not Attempted</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="pl-5">#</TableHead>
                                    <TableHead>Chapter</TableHead>
                                    <TableHead>Lesson</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Attempts</TableHead>
                                    <TableHead className="text-right">Latest Score</TableHead>
                                    <TableHead className="text-right pr-5">Last Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                            No assessments found
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rows.map((row, i) => (
                                    <TableRow key={`${row.chapterId}-${i}`}>
                                        <TableCell className="pl-5 text-muted-foreground text-sm">{i + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{row.chapterName}</div>
                                            <div className="text-xs text-muted-foreground">Chapter {row.rank}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{row.lessonName}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={row.status} />
                                        </TableCell>
                                        <TableCell className="text-right text-sm">{row.attemptsCount}</TableCell>
                                        <TableCell className="text-right text-sm">
                                            {row.latestAttempt ? (
                                                <span className={`font-semibold ${row.latestAttempt.passed ? "text-emerald-600" : "text-red-500"}`}>
                                                    {row.latestAttempt.percentage}%
                                                    <span className="ml-1 font-normal text-muted-foreground text-xs">
                                                        ({row.latestAttempt.passed ? "Pass" : "Fail"})
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-5 text-sm text-muted-foreground">
                                            {row.latestAttempt?.attemptedAt
                                                ? format(new Date(row.latestAttempt.attemptedAt), "MMM d, yyyy")
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Pending Reviews Tab ──────────────────────────────────────────────────────

function PendingReviewsTab({
    rows,
    loading,
    onRefresh,
    onOpenReview,
}: {
    rows: PendingReviewRow[];
    loading: boolean;
    onRefresh: () => void;
    onOpenReview: (row: PendingReviewRow) => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <Card className="border-border/40">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">Assessments Awaiting Review</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Text answers submitted by employees that need your scoring
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-1.5 text-muted-foreground" disabled={loading}>
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="pl-5">#</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Lesson</TableHead>
                                    <TableHead>Chapter</TableHead>
                                    <TableHead className="text-right">MCQ Score</TableHead>
                                    <TableHead className="text-right">Submitted</TableHead>
                                    <TableHead className="text-right pr-5">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                                                <p className="font-medium">All caught up!</p>
                                                <p className="text-sm">No pending reviews at the moment.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rows.map((row, i) => (
                                    <TableRow key={`${row.userId}-${row.chapterId}-${i}`} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="pl-5 text-muted-foreground text-sm">{i + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{row.firstName} {row.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{row.email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">{row.lessonName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{row.chapterName}</TableCell>
                                        <TableCell className="text-right text-sm">
                                            {row.mcqScore !== undefined
                                                ? `${row.mcqScore} / ${row.totalScore}`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {row.attemptedAt
                                                ? format(new Date(row.attemptedAt), "MMM d, yyyy")
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right pr-5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5 text-xs"
                                                onClick={() => onOpenReview(row)}
                                            >
                                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TrainingAssessments() {
    const { userDetails } = useAppSelector((state) => state.userState);
    const isHR = userDetails?.role?.toUpperCase() === "HR";

    const {
        myAssessments,
        myAssessmentsLoading,
        filter,
        handleFilterChange,
        fetchMyAssessments,
        pendingReviews,
        pendingLoading,
        fetchPendingReviews,
        reviewTarget,
        reviewAssessment,
        reviewAssessmentLoading,
        reviewSubmitting,
        openReview,
        closeReview,
        submitReview,
    } = useTrainingAssessments();

    useEffect(() => {
        if (!isHR) fetchMyAssessments("all");
        fetchPendingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const defaultTab = isHR ? "pending-reviews" : "my-assessments";
    // Note: isHR still used for header subtitle and default tab

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
                <div className="relative flex items-center gap-4 z-10">
                    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                        <ClipboardCheck className="h-7 w-7 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            Training Assessments
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                            {isHR
                                ? "Review employee text submissions and track assessment progress"
                                : "Track your assessment history and review submitted answers"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden p-6">
                <Tabs defaultValue={defaultTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="my-assessments">My Assessments</TabsTrigger>
                        <TabsTrigger value="pending-reviews" className="relative">
                            Pending Reviews
                            {pendingReviews.length > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                    {pendingReviews.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-assessments" className="mt-0">
                        <MyAssessmentsTab
                            rows={myAssessments}
                            loading={myAssessmentsLoading}
                            filter={filter}
                            onFilterChange={(f) => {
                                handleFilterChange(f);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="pending-reviews" className="mt-0">
                        <PendingReviewsTab
                            rows={pendingReviews}
                            loading={pendingLoading}
                            onRefresh={fetchPendingReviews}
                            onOpenReview={openReview}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Review Modal */}
            {reviewTarget && (
                <ReviewModal
                    row={reviewTarget}
                    assessment={reviewAssessment}
                    assessmentLoading={reviewAssessmentLoading}
                    submitting={reviewSubmitting}
                    onClose={closeReview}
                    onSubmit={submitReview}
                />
            )}
        </div>
    );
}
