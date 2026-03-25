import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EnrollStudentsModal from "@/components/training/EnrollStudentsModal";
import { useCourseDetail } from "@/hooks/Training/useCourseDetail";
import { useAppSelector } from "@/store/hooks";
import type { Chapter, AssessmentRef, Assessment } from "@/types/training";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import AssessmentView from "@/components/training/AssessmentView";
import {
    ArrowLeft,
    Loader2,
    GraduationCap,
    BookOpen,
    ChevronRight,
    ChevronDown,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    FileText,
    Download,
    Link2,
    AlignLeft,
    Video,
    ClipboardList,
    CheckCircle2,
    BookOpenCheck,
    UserPlus,
    Trash2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

// ─── Chapter Tree ─────────────────────────────────────────────────────────────

interface ChapterTreeProps {
    chapters: Chapter[];
    selectedId: string | null;
    completedChapterIds?: string[];
    isHR?: boolean;
    onSelect: (chapter: Chapter) => void;
    onDeleteChapter?: (id: string) => void;
}

function ChapterTree({
    chapters,
    selectedId,
    completedChapterIds = [],
    isHR = false,
    onSelect,
    onDeleteChapter,
}: ChapterTreeProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    if (chapters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4">
                <BookOpen className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm text-center">No chapters yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 p-2">
            {chapters.map((chapter, idx) => {
                const isSelected = selectedId === chapter._id;
                const isExpanded = expanded.has(chapter._id);
                const isCompleted = completedChapterIds.includes(chapter._id);
                const hasAssessments = chapter.assessments?.length > 0;

                return (
                    <div key={chapter._id}>
                        <div
                            role="button"
                            tabIndex={0}
                            className={cn(
                                "w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all group cursor-pointer",
                                isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted/60 text-foreground"
                            )}
                            onClick={() => onSelect(chapter)}
                            onKeyDown={(e) => e.key === "Enter" && onSelect(chapter)}
                        >
                            {/* Rank / completion indicator */}
                            <div
                                className={cn(
                                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                                    isCompleted
                                        ? isSelected
                                            ? "bg-primary-foreground/20 text-primary-foreground"
                                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                        : isSelected
                                        ? "bg-primary-foreground/20 text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                    <span>{(chapter.rank ?? idx + 1)}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p
                                    className={cn(
                                        "text-sm font-medium leading-snug truncate",
                                        isSelected
                                            ? "text-primary-foreground"
                                            : "text-foreground"
                                    )}
                                >
                                    {chapter.name}
                                </p>
                                {chapter.description && (
                                    <p
                                        className={cn(
                                            "text-xs mt-0.5 leading-relaxed",
                                            isSelected
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {isExpanded
                                            ? chapter.description
                                            : chapter.description.length > 60
                                            ? chapter.description.slice(0, 60) + "…"
                                            : chapter.description}
                                    </p>
                                )}
                                {/* Badges */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {hasAssessments && (
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                                                isSelected
                                                    ? "bg-primary-foreground/15 text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            <ClipboardList className="h-2.5 w-2.5" />
                                            Quiz
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* HR delete button */}
                            {isHR && onDeleteChapter && (
                                confirmDeleteId === chapter._id ? (
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteChapter(chapter._id);
                                                setConfirmDeleteId(null);
                                            }}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDeleteId(null);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={cn(
                                            "shrink-0 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100",
                                            isSelected
                                                ? "text-primary-foreground/70 hover:text-primary-foreground"
                                                : "text-muted-foreground hover:text-destructive"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDeleteId(chapter._id);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )
                            )}

                            {/* Expand toggle for description */}
                            {chapter.description && chapter.description.length > 60 && (
                                <button
                                    type="button"
                                    className={cn(
                                        "shrink-0 p-0.5 rounded transition-colors",
                                        isSelected
                                            ? "text-primary-foreground/70 hover:text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggle(chapter._id);
                                    }}
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-foreground mt-5 mb-2.5 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h3>
                ),
                h4: ({ children }) => (
                    <h4 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h4>
                ),
                p: ({ children }) => (
                    <p className="text-sm text-foreground leading-relaxed mb-3 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic text-foreground/80">{children}</em>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 mb-3 pl-2 text-sm text-foreground">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 mb-3 pl-2 text-sm text-foreground">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-3 bg-muted/30 rounded-r-lg text-sm text-muted-foreground italic">
                        {children}
                    </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                    const isBlock = !!className;
                    if (isBlock) {
                        const lang = className?.replace("language-", "") ?? "";
                        return (
                            <div className="my-3">
                                {lang && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-muted rounded-t-lg border border-border/50 border-b-0">
                                        <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wide">
                                            {lang}
                                        </span>
                                    </div>
                                )}
                                <pre
                                    className={cn(
                                        "overflow-x-auto p-4 bg-muted/60 border border-border/50 text-sm font-mono text-foreground",
                                        lang ? "rounded-b-lg rounded-tr-lg" : "rounded-lg"
                                    )}
                                >
                                    <code>{children}</code>
                                </pre>
                            </div>
                        );
                    }
                    return (
                        <code
                            className="px-1.5 py-0.5 rounded-md bg-muted text-[13px] font-mono text-foreground border border-border/50"
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => <>{children}</>,
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                        {children}
                    </a>
                ),
                hr: () => <Separator className="my-4" />,
                table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
                        <table className="w-full text-sm">{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-muted/50">{children}</thead>
                ),
                th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border/50 text-xs uppercase tracking-wide">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="px-4 py-2.5 text-foreground border-b border-border/30 last:border-b-0">
                        {children}
                    </td>
                ),
                tr: ({ children }) => (
                    <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

// ─── Document viewer ──────────────────────────────────────────────────────────

function DocumentViewer({ url, name, type }: { url: string; name?: string; type: "pdf" | "docx" }) {
    const [show, setShow] = useState(false);

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.download = name ?? url.split("/").pop() ?? `document.${type}`;
        a.click();
    };

    const filename = name ?? url.split("/").pop() ?? `Document.${type}`;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{filename}</span>
                    <Badge variant="secondary" className="text-xs uppercase shrink-0">
                        {type}
                    </Badge>
                </div>
                <div className="flex gap-1.5 shrink-0">
                    {type === "pdf" && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => setShow((p) => !p)}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            {show ? "Hide" : "Preview"}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8"
                        onClick={handleDownload}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                    </Button>
                </div>
            </div>
            {type === "pdf" && show && (
                <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                    <iframe
                        src={url}
                        title={filename}
                        className="w-full rounded-xl"
                        style={{ height: "600px" }}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Chapter content ──────────────────────────────────────────────────────────

interface ChapterContentProps {
    chapter: Chapter;
    lessonId: string;
    isEmployee: boolean;
    loading: boolean;
}

function ChapterContent({ chapter, lessonId, isEmployee, loading }: ChapterContentProps) {
    const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
    const [submittedAssessmentIds, setSubmittedAssessmentIds] = useState<Set<string>>(new Set());

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm animate-pulse">Loading chapter...</p>
            </div>
        );
    }

    const hasPdf = chapter.pdfResources?.length > 0;
    const hasDocx = chapter.docxResources?.length > 0;
    const hasText = chapter.textResources?.length > 0;
    const hasLinks = chapter.linkResources?.length > 0;
    const hasVideo = !!chapter.videoLecture;
    const hasAssessments = chapter.assessments?.length > 0;
    const isEmpty = !hasPdf && !hasDocx && !hasText && !hasLinks && !hasVideo && !hasAssessments;

    return (
        <>
            {activeAssessment && (
                <AssessmentView
                    assessment={activeAssessment}
                    lessonId={lessonId}
                    chapterId={chapter._id}
                    onClose={(submitted) => {
                        if (submitted) {
                            setSubmittedAssessmentIds((prev) => new Set([...prev, activeAssessment._id]));
                        }
                        setActiveAssessment(null);
                    }}
                />
            )}

            <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
                {/* Chapter header */}
                <div>
                    <h2 className="text-xl font-bold text-foreground">{chapter.name}</h2>
                    {chapter.description && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {chapter.description}
                        </p>
                    )}
                </div>

                {isEmpty && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                        <BookOpen className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No content has been added to this chapter yet.</p>
                    </div>
                )}

                {/* Video lecture */}
                {hasVideo && chapter.videoLecture && (() => {
                    const v = chapter.videoLecture.versions?.[0];
                    const videoUrl = v?.["1080p"] || v?.["720p"] || v?.["360p"] || v?.["240p"] || v?.["default"] || null;
                    return (
                        <section>
                            <SectionHeader icon={<Video className="h-4 w-4" />} title="Video Lecture" />
                            <div className="rounded-2xl overflow-hidden border border-border/50 bg-black mt-3">
                                {videoUrl ? (
                                    <video
                                        key={videoUrl}
                                        controls
                                        className="w-full max-h-96"
                                        src={videoUrl}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-white/50 text-sm">
                                        Video unavailable
                                    </div>
                                )}
                            </div>
                            {chapter.videoLecture.name && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {chapter.videoLecture.name}
                                </p>
                            )}
                        </section>
                    );
                })()}

                {/* PDF resources */}
                {hasPdf && (
                    <section>
                        <SectionHeader icon={<FileText className="h-4 w-4" />} title="PDF Documents" count={chapter.pdfResources.length} />
                        <div className="flex flex-col gap-2 mt-3">
                            {chapter.pdfResources.map((res, i) => (
                                <DocumentViewer key={i} url={res.url} name={res.name} type="pdf" />
                            ))}
                        </div>
                    </section>
                )}

                {/* DOCX resources */}
                {hasDocx && (
                    <section>
                        <SectionHeader icon={<FileText className="h-4 w-4" />} title="Word Documents" count={chapter.docxResources.length} />
                        <div className="flex flex-col gap-2 mt-3">
                            {chapter.docxResources.map((res, i) => (
                                <DocumentViewer key={i} url={res.url} name={res.name} type="docx" />
                            ))}
                        </div>
                    </section>
                )}

                {/* Text resources */}
                {hasText && (
                    <section>
                        <SectionHeader icon={<AlignLeft className="h-4 w-4" />} title="Reading Material" count={chapter.textResources.length} />
                        <div className="flex flex-col gap-3 mt-3">
                            {chapter.textResources.map((text, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border border-border/50 bg-muted/20 p-5"
                                >
                                    {text.name && (
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                            {text.name}
                                        </p>
                                    )}
                                    <MarkdownContent content={text.content} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Link resources */}
                {hasLinks && (
                    <section>
                        <SectionHeader icon={<Link2 className="h-4 w-4" />} title="External Links" count={chapter.linkResources.length} />
                        <div className="flex flex-col gap-2 mt-3">
                            {chapter.linkResources.map((res, i) => (
                                <a
                                    key={res._id ?? i}
                                    href={res.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group"
                                >
                                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm text-primary group-hover:underline truncate">
                                        {res.name || res.link}
                                    </span>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Assessments */}
                {hasAssessments && isEmployee && (
                    <section>
                        <SectionHeader
                            icon={<ClipboardList className="h-4 w-4" />}
                            title="Assessments"
                            count={chapter.assessments.length}
                        />
                        <div className="flex flex-col gap-3 mt-3">
                            {chapter.assessments.map((aRef: AssessmentRef, i) => {
                                const assessment = aRef.details ?? null;
                                if (!assessment) {
                                    return (
                                        <div
                                            key={i}
                                            className="p-4 rounded-xl border border-border/50 bg-muted/20 text-sm text-muted-foreground"
                                        >
                                            Assessment not available
                                        </div>
                                    );
                                }
                                return (
                                    <div
                                        key={assessment._id ?? i}
                                        className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground text-sm truncate">
                                                    {assessment.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {assessment.questions?.length ?? 0} question
                                                    {(assessment.questions?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                                                    Pass: {assessment.passingScore ?? 70}%
                                                </p>
                                            </div>
                                        </div>
                                        {submittedAssessmentIds.has(assessment._id) ? (
                                            <Badge className="gap-1.5 shrink-0 bg-muted text-muted-foreground border border-border hover:bg-muted">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Submitted
                                            </Badge>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="gap-1.5 shrink-0"
                                                onClick={() => setActiveAssessment(assessment)}
                                            >
                                                <ClipboardList className="h-3.5 w-3.5" />
                                                Take Assessment
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* HR: assessment info (read-only) */}
                {hasAssessments && !isEmployee && (
                    <section>
                        <SectionHeader
                            icon={<ClipboardList className="h-4 w-4" />}
                            title="Assessments"
                            count={chapter.assessments.length}
                        />
                        <div className="flex flex-col gap-2 mt-3">
                            {chapter.assessments.map((aRef: AssessmentRef, i) => {
                                const assessment = aRef.details ?? null;
                                if (!assessment) return null;
                                return (
                                    <div
                                        key={assessment._id ?? i}
                                        className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20"
                                    >
                                        <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {assessment.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {assessment.questions?.length ?? 0} question
                                                {(assessment.questions?.length ?? 0) !== 1 ? "s" : ""} · Pass:{" "}
                                                {assessment.passingScore ?? 70}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHeader({
    icon,
    title,
    count,
}: {
    icon: React.ReactNode;
    title: string;
    count?: number;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="text-muted-foreground">{icon}</div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {title}
            </h3>
            {count !== undefined && count > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                    {count}
                </Badge>
            )}
            <Separator className="flex-1 ml-2" />
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CourseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userDetails } = useAppSelector((state) => state.userState);
    const isHR = userDetails?.role?.toUpperCase() === "HR";

    const {
        lesson,
        loading,
        error,
        refetch,
        selectedChapter,
        selectChapter,
        chapterLoading,
        deleteChapter,
    } = useCourseDetail(id);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [enrollOpen, setEnrollOpen] = useState(false);

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-base font-medium text-muted-foreground animate-pulse">
                    Loading course...
                </p>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-24 gap-5">
                <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="text-center max-w-md">
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        {lesson === null && !error ? "Course Not Found" : "Failed to Load Course"}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {error ?? "The course you're looking for doesn't exist or you don't have access to it."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {error && (
                        <Button variant="outline" onClick={refetch} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    )}
                    <Button variant={error ? "ghost" : "outline"} onClick={() => navigate("/training/courses")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Courses
                    </Button>
                </div>
            </div>
        );
    }

    const chapters = lesson.chapters ?? [];
    const sortedChapters = [...chapters].sort(
        (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
    );

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header card */}
            <div className="relative overflow-hidden rounded-2xl bg-card px-5 py-5 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-48 h-48 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                            onClick={() => navigate("/training/courses")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Courses
                        </Button>
                        <Separator orientation="vertical" className="h-5" />
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-foreground leading-tight">
                                    {lesson.name}
                                </h1>
                                {lesson.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {lesson.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-xs">
                            <BookOpen className="h-3 w-3" />
                            {chapters.length} Chapter{chapters.length !== 1 ? "s" : ""}
                        </Badge>
                        {isHR && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5"
                                    onClick={() => setEnrollOpen(true)}
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Enroll Students
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => navigate(`/training/${id}/chapter/create`)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Chapter
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {enrollOpen && (
                <EnrollStudentsModal
                    lessonId={id ?? ""}
                    lessonName={lesson.name}
                    onClose={() => setEnrollOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex gap-4 min-h-[calc(100vh-220px)]">
                {/* Sidebar toggle button (mobile / collapsed state) */}
                <Button
                    variant="outline"
                    size="icon"
                    className="fixed bottom-6 left-6 z-30 h-10 w-10 rounded-full shadow-md lg:hidden"
                    onClick={() => setSidebarOpen((p) => !p)}
                >
                    {sidebarOpen ? (
                        <PanelLeftClose className="h-4 w-4" />
                    ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                    )}
                </Button>

                {/* Chapter tree sidebar */}
                <div
                    className={cn(
                        "flex-shrink-0 rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden transition-all duration-300",
                        sidebarOpen ? "w-72" : "w-0 opacity-0 pointer-events-none"
                    )}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Chapters
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <PanelLeftClose className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
                        <ChapterTree
                            chapters={sortedChapters}
                            selectedId={selectedChapter?._id ?? null}
                            completedChapterIds={lesson.completedChapters ?? []}
                            isHR={isHR}
                            onSelect={(ch) => selectChapter(ch, !isHR)}
                            onDeleteChapter={isHR ? deleteChapter : undefined}
                        />
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden min-w-0">
                    {/* Show sidebar toggle when collapsed */}
                    {!sidebarOpen && (
                        <div className="border-b border-border/50 px-4 py-2.5 flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-muted-foreground hover:text-foreground h-8"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <PanelLeftOpen className="h-3.5 w-3.5" />
                                Show Chapters
                            </Button>
                        </div>
                    )}

                    {selectedChapter ? (
                        <ChapterContent
                            chapter={selectedChapter}
                            lessonId={id ?? ""}
                            isEmployee={!isHR}
                            loading={chapterLoading}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-80 text-muted-foreground">
                            <BookOpenCheck className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-base font-medium">Select a chapter to begin</p>
                            <p className="text-sm mt-1 text-muted-foreground/70">
                                {sortedChapters.length > 0
                                    ? "Click any chapter from the sidebar to view its content"
                                    : isHR
                                    ? "Add your first chapter using the button above"
                                    : "No chapters available yet"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
