import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ApiCaller from "@/utils/ApiCaller";
import type { ApplicantDetail, Round } from "@/types/hiring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InterviewPanel from "@/components/hiring/InterviewPanel";
import OfferDialog from "@/components/hiring/OfferDialog";
import {
    ArrowLeft,
    Loader2,
    BriefcaseBusiness,
    Building2,
    UserCircle2,
    Mail,
    Phone,
    CalendarDays,
    FileText,
    Download,
    StickyNote,
    CheckCircle2,
    AlignLeft,
    CalendarCheck2,
    UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

const APPLICANT_STATUS_STYLES: Record<string, string> = {
    APPLIED:
        "bg-muted text-muted-foreground border-border",
    INTERVIEWING:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    OFFERED:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    REJECTED:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const ROUND_TYPE_STYLES: Record<string, string> = {
    INTERVIEW:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    TEST:
        "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    ASSIGNMENT:
        "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
};

function getDeptName(
    dep: ApplicantDetail["openingId"]["departmentId"],
): string {
    if (!dep) return "—";
    return typeof dep === "object" ? dep.name : "—";
}

function getManagerName(
    mgr: ApplicantDetail["openingId"]["HiringManager"],
): string {
    if (!mgr) return "—";
    return typeof mgr === "object" ? `${mgr.firstName} ${mgr.lastName}` : "—";
}

function getManagerEmail(
    mgr: ApplicantDetail["openingId"]["HiringManager"],
): string {
    if (!mgr || typeof mgr !== "object") return "";
    return mgr.email;
}

// ─── Chevron progress bar ────────────────────────────────────────────────────

interface RoundProgressBarProps {
    rounds: Round[];
    currentRound: Round | null | undefined;
    selectedIdx: number;
    onSelect: (idx: number) => void;
}

function RoundProgressBar({
    rounds,
    currentRound,
    selectedIdx,
    onSelect,
}: RoundProgressBarProps) {
    if (!rounds || rounds.length === 0) return null;

    // Sort rounds by rank to ensure left-to-right order (smallest rank = left, largest rank = right)
    const sortedRounds = [...rounds].sort((a, b) => {
        const rankA = (a as any)?.rank ?? 0;
        const rankB = (b as any)?.rank ?? 0;
        return rankA - rankB;
    });

    // Find active (current) round index from sorted rounds
    const activeIdx = currentRound
        ? sortedRounds.findIndex((r) => r._id === currentRound._id)
        : -1;

    return (
        <div className="flex w-full items-stretch h-10 select-none">
            {sortedRounds.map((round, idx) => {
                const isPast = activeIdx >= 0 && idx < activeIdx;
                const isActive = idx === activeIdx;
                const isSelected = idx === selectedIdx;
                const isLast = idx === sortedRounds.length - 1;
                const isBlocked = activeIdx >= 0 && idx > activeIdx;

                return (
                    <button
                        key={round._id ?? idx}
                        onClick={() => !isBlocked && onSelect(idx)}
                        disabled={isBlocked}
                        className={cn(
                            "relative flex flex-1 items-center justify-center text-xs font-semibold transition-all duration-200 focus:outline-none",
                            // chevron shape via clip-path except last element
                            !isLast && "chevron-segment",
                            // colors
                            isPast
                                ? "bg-primary/20 text-primary hover:bg-primary/30"
                                : isActive
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : isSelected
                                ? "bg-muted-foreground/20 text-foreground"
                                : isBlocked
                                ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-50"
                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                            isSelected && !isBlocked && "ring-2 ring-primary ring-inset",
                        )}
                        title={isBlocked ? "Complete previous rounds first" : round.name}
                        style={{ clipPath: !isLast ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)" : "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)" }}
                    >
                        <span className="truncate px-4">
                            {isPast ? (
                                <CheckCircle2 className="h-3.5 w-3.5 mx-auto" />
                            ) : (
                                round.name
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Round info panel ─────────────────────────────────────────────────────────

interface RoundInfoPanelProps {
    round: Round;
    isCurrent: boolean;
}

function RoundInfoPanel({ round, isCurrent }: RoundInfoPanelProps) {
    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-semibold text-foreground">
                    {round.name}
                </span>
                {isCurrent && (
                    <Badge className="text-xs bg-primary text-primary-foreground">
                        Current Round
                    </Badge>
                )}
                {round.type && (
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs border",
                            ROUND_TYPE_STYLES[round.type] ??
                                "bg-muted text-muted-foreground border-border",
                        )}
                    >
                        {round.type}
                    </Badge>
                )}
            </div>
            {round.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {round.description}
                </p>
            ) : (
                <p className="text-sm text-muted-foreground italic">
                    No description provided for this round.
                </p>
            )}
        </div>
    );
}

// ─── Resume panel ─────────────────────────────────────────────────────────────

function ResumePanel({ resumeUrl }: { resumeUrl: string }) {
    const [show, setShow] = useState(false);

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = resumeUrl;
        a.target = "_blank";
        a.download = "resume.pdf";
        a.click();
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Resume
                </span>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => setShow((p) => !p)}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        {show ? "Hide" : "Preview"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={handleDownload}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                    </Button>
                </div>
            </div>
            {show ? (
                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20 flex-1 min-h-175">
                    <iframe
                        src={resumeUrl}
                        title="Resume PDF"
                        className="w-full h-full min-h-175 rounded-lg"
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 min-h-20 gap-2 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <FileText className="h-8 w-8 opacity-30" />
                    <p className="text-xs">Click Preview to view the resume</p>
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApplicantDetails() {
    const { applicantId } = useParams<{ applicantId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from;

    const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);
    const [showOfferDialog, setShowOfferDialog] = useState(false);

    // Show dialog if status is OFFERING
    useEffect(() => {
        if (applicant && applicant.status === "OFFERING") {
            setShowOfferDialog(true);
        } else {
            setShowOfferDialog(false);
        }
    }, [applicant]);
    const fetchApplicant = useCallback(async () => {
        if (!applicantId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await ApiCaller<null, { applicant: ApplicantDetail }>({
                requestType: "GET",
                paths: ["api", "v1", "hiring", "applicants", applicantId],
            });
            if (result.ok) {
                const data = result.response.data.applicant;
                setApplicant(data);
                // Pre-select current round
                if (data.currentRound && data.openingId?.rounds?.length) {
                    const idx = data.openingId.rounds.findIndex(
                        (r) => r._id === (data.currentRound as Round)._id,
                    );
                    if (idx >= 0) setSelectedRoundIdx(idx);
                }
            } else {
                setError((result.response as unknown as { message?: string })?.message || "Applicant not found");
            }
        } catch {
            setError("Failed to fetch applicant details");
        } finally {
            setLoading(false);
        }
    }, [applicantId]);

    useEffect(() => {
        fetchApplicant();
    }, [fetchApplicant]);

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-base font-medium text-muted-foreground animate-pulse">
                    Loading applicant details...
                </p>
            </div>
        );
    }

    if (error || !applicant) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
                <BriefcaseBusiness className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">
                    {error || "Applicant not found"}
                </p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const opening = applicant.openingId;
    const rounds: Round[] = Array.isArray(opening?.rounds) ? opening.rounds : [];
    const currentRound =
        applicant.currentRound && typeof applicant.currentRound === "object"
            ? (applicant.currentRound as Round)
            : null;

    // Sort rounds by rank for consistent left-to-right order (smallest rank = left, largest rank = right)
    const sortedRounds = [...rounds].sort((a, b) => {
        const rankA = (a as any)?.rank ?? 0;
        const rankB = (b as any)?.rank ?? 0;
        return rankA - rankB;
    });

    const selectedRound: Round | null = sortedRounds[selectedRoundIdx] ?? null;
    const activeRoundIdx = currentRound ? sortedRounds.findIndex((r) => r._id === currentRound._id) : -1;
    // Use rank-based comparison when available, fall back to array index
    const selectedRank = selectedRound?.rank ?? selectedRoundIdx + 1;
    const activeRank = activeRoundIdx >= 0 ? (sortedRounds[activeRoundIdx]?.rank ?? activeRoundIdx + 1) : 1;
    const isSelectedRoundBlocked = selectedRank > activeRank;

    const appliedDate = applicant.createdAt
        ? new Date(applicant.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 px-2 sm:px-3">
            {/* Offer Dialog for OFFERING status */}
            {applicant && (
                <OfferDialog
                    open={showOfferDialog}
                    onOpenChange={setShowOfferDialog}
                    applicantId={applicant._id}
                    applicantName={applicant.name}
                    onSuccess={fetchApplicant}
                />
            )}

            {/* Back */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        if (from === 'reviews') {
                            navigate('/reviews');
                        } else if (opening?._id) {
                            navigate(`/hiring/${opening._id}`);
                        } else {
                            navigate(-1);
                        }
                    }}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {from === 'reviews' ? 'Reviews' : 'Opening'}
                </Button>

                {applicant.status === "OFFERED" && (
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            const nameParts = applicant.name.trim().split(" ");
                            const firstName = nameParts[0] ?? "";
                            const lastName = nameParts.slice(1).join(" ") || "";
                            const deptId =
                                opening?.departmentId && typeof opening.departmentId === "object"
                                    ? opening.departmentId._id
                                    : undefined;
                            navigate("/employee", {
                                state: {
                                    prefill: { firstName, lastName, email: applicant.email, deptId },
                                },
                            });
                        }}
                    >
                        <UserPlus className="h-4 w-4" />
                        Add as Employee
                    </Button>
                )}
            </div>

            {/* Candidate card */}
            <div className="relative overflow-hidden rounded-2xl bg-card px-4 py-5 sm:px-5 sm:py-6 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                                {applicant.name?.[0]?.toUpperCase() ?? "A"}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                    {applicant.name}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Candidate Information
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-sm font-semibold border shrink-0 mt-1",
                                APPLICANT_STATUS_STYLES[applicant.status],
                            )}
                        >
                            {applicant.status}
                        </Badge>
                    </div>

                    <Separator className="my-5" />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    Email
                                </p>
                                <p className="text-sm font-medium text-foreground break-all">
                                    {applicant.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    Phone
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {applicant.phone || "—"}
                                </p>
                            </div>
                        </div>
                        {appliedDate && (
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Applied
                                    </p>
                                    <p className="text-sm font-medium text-foreground">
                                        {appliedDate}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {applicant.note && (
                        <div className="mt-4 flex items-start gap-2 bg-muted/40 rounded-lg p-3 border border-border/50">
                            <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">{applicant.note}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Opening card */}
            {opening && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardContent className="px-4 py-5 sm:px-5">
                        <h2 className="text-lg font-semibold text-foreground mb-1">
                            {opening.title}
                        </h2>
                        {opening.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                {opening.description}
                            </p>
                        )}
                        <Separator className="mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Department
                                    </p>
                                    <p className="text-sm font-medium text-foreground">
                                        {getDeptName(opening.departmentId)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                    <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Hiring Manager
                                    </p>
                                    <p className="text-sm font-medium text-foreground">
                                        {getManagerName(opening.HiringManager)}
                                    </p>
                                    {getManagerEmail(opening.HiringManager) && (
                                        <p className="text-xs text-muted-foreground">
                                            {getManagerEmail(opening.HiringManager)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Round progress bar */}
            {rounds.length > 0 && (
                <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="px-4 sm:px-5 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Interview Rounds Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-5 pt-0 pb-4">
                        <RoundProgressBar
                            rounds={sortedRounds}
                            currentRound={currentRound}
                            selectedIdx={selectedRoundIdx}
                            onSelect={setSelectedRoundIdx}
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            Click a round to view its details
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Round status + Resume tabbed card */}
            {(rounds.length > 0 || applicant.resume) && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <Tabs defaultValue={rounds.length > 0 ? "round" : "resume"}>
                        <CardHeader className="px-4 sm:px-5 pb-0">
                            <TabsList className="w-full sm:w-auto">
                                {rounds.length > 0 && selectedRound && (
                                    <TabsTrigger value="round" className="gap-1.5">
                                        <AlignLeft className="h-3.5 w-3.5" />
                                        Round Status
                                    </TabsTrigger>
                                )}
                                {rounds.length > 0 && selectedRound && (
                                    <TabsTrigger value="interview" className="gap-1.5">
                                        <CalendarCheck2 className="h-3.5 w-3.5" />
                                        Interview
                                    </TabsTrigger>
                                )}
                                {applicant.resume && (
                                    <TabsTrigger value="resume" className="gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        Resume
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </CardHeader>
                        <Separator className="mt-3" />
                        {rounds.length > 0 && selectedRound && (
                            <TabsContent value="round" className="mt-0">
                                <CardContent className="px-4 sm:px-5 pt-4">
                                    <RoundInfoPanel
                                        round={selectedRound}
                                        isCurrent={
                                            !!currentRound && selectedRound._id === currentRound._id
                                        }
                                    />
                                </CardContent>
                            </TabsContent>
                        )}
                        {rounds.length > 0 && selectedRound && (
                            <TabsContent value="interview" className="mt-0">
                                <CardContent className="px-4 sm:px-5 pt-4">
                                    <InterviewPanel
                                        applicantId={applicant._id}
                                        round={selectedRound}
                                        departmentId={
                                            opening?.departmentId &&
                                            typeof opening.departmentId === "object"
                                                ? opening.departmentId._id
                                                : (opening?.departmentId as string | null) ?? null
                                        }
                                        onStatusChange={fetchApplicant}
                                        isBlocked={isSelectedRoundBlocked}
                                    />
                                </CardContent>
                            </TabsContent>
                        )}
                        {applicant.resume && (
                            <TabsContent value="resume" className="mt-0">
                                <CardContent className="px-4 sm:px-5 pt-4">
                                    <ResumePanel resumeUrl={applicant.resume} />
                                </CardContent>
                            </TabsContent>
                        )}
                    </Tabs>
                </Card>
            )}

            {/* Screening Q&A */}
            {Array.isArray(applicant.questions) && applicant.questions.length > 0 && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="px-4 sm:px-5 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlignLeft className="h-4 w-4 text-muted-foreground" />
                            Screening Answers
                            <Badge variant="secondary" className="ml-auto">
                                {applicant.questions.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="px-4 sm:px-5 pt-4 grid gap-3">
                        {applicant.questions.map((q, idx) => {
                            const questionText =
                                q.questionId && typeof q.questionId === "object"
                                    ? q.questionId.questionText
                                    : `Question ${idx + 1}`;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl bg-muted/30 border border-border/50 p-4 flex flex-col gap-1.5"
                                >
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Q{idx + 1}
                                    </p>
                                    <p className="text-sm font-medium text-foreground">
                                        {questionText}
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {q.answer || <em className="opacity-60">No answer provided</em>}
                                    </p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
