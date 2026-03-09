import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCaller from "@/utils/ApiCaller";
import type { Opening } from "@/types/hiring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Loader2,
    Trash,
    BriefcaseBusiness,
    Building2,
    UserCircle2,
    Layers,
    HelpCircle,
    Users,
    CalendarDays,
    StickyNote,
    CheckCircle2,
    ClipboardList,
    AlignLeft,
    Link2,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    CLOSED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
};

const ROUND_TYPE_STYLES: Record<string, string> = {
    INTERVIEW: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    TEST: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    ASSIGNMENT: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
};

function getDepartmentName(dep: Opening["departmentId"]): string {
    if (!dep) return "—";
    return typeof dep === "object" ? dep.name : "—";
}

function getManagerName(mgr: Opening["HiringManager"]): string {
    if (!mgr) return "—";
    return typeof mgr === "object" ? `${mgr.firstName} ${mgr.lastName}` : "—";
}

function getManagerEmail(mgr: Opening["HiringManager"]): string {
    if (!mgr || typeof mgr !== "object") return "";
    return mgr.email;
}

export default function HiringDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [opening, setOpening] = useState<Opening | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/job-opening/${id}`;
        navigator.clipboard.writeText(link).then(() => {
            setLinkCopied(true);
            toast.success("Link copied to clipboard");
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    useEffect(() => {
        if (!id) return;
        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await ApiCaller<null, Opening>({
                    requestType: "GET",
                    paths: ["api", "v1", "hiring", "openings", id],
                });
                if (result.ok) {
                    setOpening(result.response.data);
                } else {
                    setError((result.response as any)?.message || "Opening not found");
                }
            } catch {
                setError("Failed to fetch opening details");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        setDeleteLoading(true);
        try {
            const result = await ApiCaller<null, null>({
                requestType: "DELETE",
                paths: ["api", "v1", "hiring", "openings", id],
            });
            if (result.ok) {
                toast.success("Opening deleted");
                navigate("/hiring");
            } else {
                toast.error((result.response as any)?.message || "Failed to delete");
                setDeleteLoading(false);
            }
        } catch {
            toast.error("An error occurred");
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-base font-medium text-muted-foreground animate-pulse">
                    Loading opening details...
                </p>
            </div>
        );
    }

    if (error || !opening) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
                <BriefcaseBusiness className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">
                    {error || "Opening not found"}
                </p>
                <Button variant="outline" onClick={() => navigate("/hiring")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Hiring
                </Button>
            </div>
        );
    }

    const createdAt = opening.createdAt
        ? new Date(opening.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Back + Actions */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/hiring")}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Hiring
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopyLink}
                >
                    {linkCopied ? (
                        <><Check className="h-4 w-4 text-green-500" />Copied!</>
                    ) : (
                        <><Link2 className="h-4 w-4" />Copy Link</>
                    )}
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsDeleteDialogOpen(true)}
                >
                    <Trash className="h-4 w-4" />
                    Delete
                </Button>
            </div>

            {/* Hero card */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 border border-border/50">
                                <BriefcaseBusiness className="h-6 w-6 text-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                    {opening.title}
                                </h1>
                                {createdAt && (
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        Posted {createdAt}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-sm font-semibold border shrink-0",
                                STATUS_STYLES[opening.Status],
                            )}
                        >
                            {opening.Status}
                        </Badge>
                    </div>

                    <p className="text-muted-foreground text-base leading-relaxed">
                        {opening.description}
                    </p>

                    {opening.note && (
                        <div className="mt-4 flex items-start gap-2 bg-muted/40 rounded-lg p-3 border border-border/50">
                            <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">{opening.note}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Meta row: Department + Manager */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50 shrink-0">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Department
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                                {getDepartmentName(opening.departmentId)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50 shrink-0">
                            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Hiring Manager
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                                {getManagerName(opening.HiringManager)}
                            </p>
                            {getManagerEmail(opening.HiringManager) && (
                                <p className="text-xs text-muted-foreground">
                                    {getManagerEmail(opening.HiringManager)}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rounds */}
            {Array.isArray(opening.rounds) && opening.rounds.length > 0 && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Layers className="h-5 w-5 text-muted-foreground" />
                            Interview Rounds
                            <Badge variant="secondary" className="ml-auto">
                                {opening.rounds.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 grid gap-3">
                        {opening.rounds.map((round, idx) => (
                            <div
                                key={round._id ?? idx}
                                className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50"
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border text-xs font-bold text-muted-foreground shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground">
                                            {round.name}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs border",
                                                ROUND_TYPE_STYLES[round.type],
                                            )}
                                        >
                                            {round.type}
                                        </Badge>
                                    </div>
                                    {round.description && (
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            {round.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Questions */}
            {Array.isArray(opening.questions) && opening.questions.length > 0 && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <HelpCircle className="h-5 w-5 text-muted-foreground" />
                            Screening Questions
                            <Badge variant="secondary" className="ml-auto">
                                {opening.questions.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 grid gap-3">
                        {opening.questions.map((q, idx) => (
                            <div
                                key={q._id ?? idx}
                                className="p-4 rounded-xl bg-muted/30 border border-border/50 grid gap-2"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] border-border text-muted-foreground"
                                            >
                                                {q.questionType === "MULTIPLE_CHOICE" ? (
                                                    <span className="flex items-center gap-1">
                                                        <ClipboardList className="h-3 w-3" />
                                                        Multiple Choice
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <AlignLeft className="h-3 w-3" />
                                                        Text
                                                    </span>
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-medium text-foreground leading-relaxed">
                                            {q.questionText}
                                        </p>
                                        {q.questionType === "MULTIPLE_CHOICE" &&
                                            Array.isArray(q.options) &&
                                            q.options.length > 0 && (
                                                <ul className="mt-2 grid gap-1">
                                                    {q.options.map((opt, oIdx) => (
                                                        <li
                                                            key={oIdx}
                                                            className="flex items-center gap-2 text-xs text-muted-foreground"
                                                        >
                                                            <span className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-[10px] font-medium shrink-0">
                                                                {String.fromCharCode(65 + oIdx)}
                                                            </span>
                                                            {opt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Applicants */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        Applicants
                        {Array.isArray(opening.applicants) && opening.applicants.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                                {opening.applicants.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <Separator />
                {Array.isArray(opening.applicants) && opening.applicants.length > 0 ? (
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="font-semibold pl-5">#</TableHead>
                                    <TableHead className="font-semibold">Applicant</TableHead>
                                    <TableHead className="font-semibold">Phone</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Applied</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {opening.applicants.map((applicant, idx) => (
                                    <TableRow
                                        key={applicant._id ?? idx}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <TableCell className="pl-5 text-muted-foreground text-sm font-mono">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                    {applicant.name?.[0]?.toUpperCase() ?? "A"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{applicant.name}</p>
                                                    <p className="text-xs text-muted-foreground">{applicant.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {applicant.phone || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs font-semibold border",
                                                    applicant.status === "OFFERED"
                                                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                                        : applicant.status === "REJECTED"
                                                        ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                                        : applicant.status === "INTERVIEWING"
                                                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                                                        : "bg-muted text-muted-foreground border-border",
                                                )}
                                            >
                                                {applicant.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {applicant.createdAt
                                                ? new Date(applicant.createdAt).toLocaleDateString("en-US", {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                  })
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                ) : (
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                        <Users className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No applicants yet</p>
                        <p className="text-xs text-muted-foreground/70">Share the job link to start receiving applications</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-2"
                            onClick={handleCopyLink}
                        >
                            {linkCopied ? (
                                <><Check className="h-4 w-4 text-green-500" />Copied!</>
                            ) : (
                                <><Link2 className="h-4 w-4" />Copy Job Link</>
                            )}
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* Empty states for rounds/questions */}
            {(!opening.rounds || opening.rounds.length === 0) &&
                (!opening.questions || opening.questions.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                        <CheckCircle2 className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No rounds or questions defined for this opening</p>
                    </div>
                )}

            {/* Delete confirmation */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(v) => {
                    if (!deleteLoading) setIsDeleteDialogOpen(v);
                }}
            >
                <DialogContent className="sm:max-w-100">
                    <DialogHeader>
                        <DialogTitle>Delete Opening</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {opening.title}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
