import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCreateChapter, TOTAL_STEPS } from "@/hooks/Training/useCreateChapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
    Check,
    Plus,
    Trash2,
    Loader2,
    FileText,
    Link2,
    AlignLeft,
    Video,
    BookOpen,
    X,
    UploadCloud,
    ClipboardList,
    User,
    Search,
    ChevronDown,
} from "lucide-react";

type ResourceType = "text" | "link" | "pdf" | "docx";

const RESOURCE_TYPES: { type: ResourceType; label: string; icon: React.ElementType; desc: string }[] = [
    { type: "text", label: "Reading Material", icon: AlignLeft, desc: "Plain text or markdown content" },
    { type: "link", label: "External Link", icon: Link2, desc: "URL to an external resource" },
    { type: "pdf", label: "PDF Document", icon: FileText, desc: "Upload a PDF file" },
    { type: "docx", label: "Word Document", icon: FileText, desc: "Upload a DOCX file" },
];

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_META = [
    {
        step: 1,
        label: "Basic Info",
        icon: BookOpen,
        desc: "Chapter name & description",
    },
    {
        step: 2,
        label: "Resources",
        icon: FileText,
        desc: "Texts, links, PDFs & DOCX",
    },
    {
        step: 3,
        label: "Video",
        icon: Video,
        desc: "Optional video lecture",
    },
    {
        step: 4,
        label: "Assessment",
        icon: ClipboardList,
        desc: "Optional quiz/assessment",
    },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateChapter() {
    const { id: lessonId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
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
    } = useCreateChapter(lessonId ?? "");

    const pdfInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [showPicker, setShowPicker] = useState(false);

    const handleResourceTypeSelect = (type: ResourceType) => {
        setShowPicker(false);
        if (type === "text") addTextResource();
        else if (type === "link") addLinkResource();
        else if (type === "pdf") pdfInputRef.current?.click();
        else if (type === "docx") docxInputRef.current?.click();
    };

    const totalResources =
        formData.textResources.length +
        formData.linkResources.length +
        formData.pdfResources.length +
        formData.docxResources.length;

    const onSubmit = async () => {
        const ok = await handleSubmit();
        if (ok) {
            toast.success("Chapter created successfully");
            navigate(`/training/${lessonId}`);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-card px-5 py-5 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-48 h-48 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                        onClick={() => { clearSession(); navigate(`/training/${lessonId}`); }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Course
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Create Chapter</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Add a new chapter to this course
                        </p>
                    </div>
                </div>
            </div>

            {/* Step card */}
            <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
                {/* Step indicator */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-0">
                        {STEP_META.map((s, i) => {
                            const Icon = s.icon;
                            const done = step > s.step;
                            const active = step === s.step;
                            return (
                                <div key={s.step} className="flex items-center flex-1 min-w-0">
                                    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                                        <div
                                            className={cn(
                                                "flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all",
                                                done
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : active
                                                        ? "border-primary text-primary bg-primary/10"
                                                        : "border-border text-muted-foreground bg-muted/30"
                                            )}
                                        >
                                            {done ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Icon className="h-4 w-4" />
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[11px] font-medium text-center leading-tight hidden sm:block",
                                                active ? "text-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < STEP_META.length - 1 && (
                                        <div
                                            className={cn(
                                                "h-0.5 w-6 mx-1 rounded-full transition-all",
                                                step > s.step ? "bg-primary" : "bg-border"
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Form content */}
                <div className="px-6 py-6">
                    {/* Error banner */}
                    {error && (
                        <div className="mb-4 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 px-3 py-2.5 rounded-lg flex items-start gap-2">
                            <X className="h-4 w-4 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* ── STEP 1: Basic Info ── */}
                    {step === 1 && (
                        <div className="grid gap-5">
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">
                                    Chapter Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleBasicChange}
                                    placeholder="e.g. Introduction to React Hooks"
                                    className={cn(fieldErrors.name && "border-red-400")}
                                />
                                {fieldErrors.name && (
                                    <p className="text-red-500 text-xs">{fieldErrors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="description">
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleBasicChange}
                                    placeholder="Describe what this chapter covers..."
                                    rows={4}
                                    className={cn("resize-none", fieldErrors.description && "border-red-400")}
                                />
                                {fieldErrors.description && (
                                    <p className="text-red-500 text-xs">{fieldErrors.description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Resources ── */}
                    {step === 2 && (
                        <div className="grid gap-5">
                            {/* Hidden file inputs */}
                            <input
                                ref={pdfInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => { handlePdfUpload(e.target.files); e.target.value = ""; }}
                            />
                            <input
                                ref={docxInputRef}
                                type="file"
                                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                multiple
                                className="hidden"
                                onChange={(e) => { handleDocxUpload(e.target.files); e.target.value = ""; }}
                            />

                            {/* Header row */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Chapter Resources
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {totalResources === 0
                                            ? "Add texts, links, PDFs, or Word documents"
                                            : `${totalResources} resource${totalResources !== 1 ? "s" : ""} added`}
                                    </p>
                                </div>

                                {/* Single "Add Resource" button with type picker */}
                                <div className="relative">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadingPdf || uploadingDocx}
                                        onClick={() => setShowPicker((v) => !v)}
                                        className="gap-1.5 h-8"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Resource
                                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showPicker && "rotate-180")} />
                                    </Button>

                                    {showPicker && (
                                        <>
                                            {/* backdrop */}
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowPicker(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-1.5 z-20 w-56 rounded-xl border border-border bg-popover shadow-md overflow-hidden">
                                                {RESOURCE_TYPES.map(({ type, label, icon: Icon, desc }) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => handleResourceTypeSelect(type)}
                                                        className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                                                    >
                                                        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Upload progress indicators */}
                            {(uploadingPdf || uploadingDocx) && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {uploadingPdf ? "Uploading PDF…" : "Uploading DOCX…"}
                                </div>
                            )}

                            {/* Empty state */}
                            {totalResources === 0 && !uploadingPdf && !uploadingDocx && (
                                <EmptyState
                                    icon={<UploadCloud className="h-7 w-7" />}
                                    text='No resources added — click "Add Resource" to get started'
                                />
                            )}

                            {/* Unified resource list */}
                            {totalResources > 0 && (
                                <div className="grid gap-3">
                                    {/* Text resources */}
                                    {formData.textResources.map((t, idx) => (
                                        <div
                                            key={`text-${idx}`}
                                            className="border border-border rounded-xl p-3 bg-muted/20"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                                                        Text {idx + 1}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeTextResource(idx)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={t.content}
                                                onChange={(e) => updateTextResource(idx, e.target.value)}
                                                placeholder="Enter content here..."
                                                rows={3}
                                                className="resize-none text-sm"
                                            />
                                        </div>
                                    ))}

                                    {/* Link resources */}
                                    {formData.linkResources.map((url, idx) => (
                                        <div key={`link-${idx}`} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                                            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <Input
                                                value={url}
                                                onChange={(e) => updateLinkResource(idx, e.target.value)}
                                                placeholder="https://example.com/resource"
                                                className="flex-1 text-sm h-7 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                            />
                                            <Badge variant="outline" className="text-xs shrink-0">Link</Badge>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLinkResource(idx)}
                                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}

                                    {/* PDF resources */}
                                    {formData.pdfResources.map((url, idx) => (
                                        <UploadedFileRow
                                            key={`pdf-${idx}`}
                                            url={url}
                                            ext="PDF"
                                            onRemove={() => removePdfResource(idx)}
                                        />
                                    ))}

                                    {/* DOCX resources */}
                                    {formData.docxResources.map((url, idx) => (
                                        <UploadedFileRow
                                            key={`docx-${idx}`}
                                            url={url}
                                            ext="DOCX"
                                            onRemove={() => removeDocxResource(idx)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Video ── */}
                    {step === 3 && (
                        <div className="grid gap-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Video Lecture
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Optional — upload an MP4/WebM/MOV file to S3
                                    </p>
                                </div>
                                {formData.videoLecture && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearVideoLecture}
                                        className="gap-1.5 h-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Remove
                                    </Button>
                                )}
                            </div>

                            {/* Upload zone */}
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-colors cursor-pointer",
                                    uploadingVideo
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                                )}
                                onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                            >
                                {uploadingVideo ? (
                                    <>
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        <p className="text-sm text-muted-foreground">Uploading to S3...</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-foreground">
                                                Click to upload video
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                MP4, WebM, or MOV — uploaded to training-videos bucket
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 pointer-events-none"
                                        >
                                            <UploadCloud className="h-3.5 w-3.5" />
                                            Choose File
                                        </Button>
                                    </>
                                )}
                            </div>
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,.mov"
                                className="hidden"
                                onChange={(e) => handleVideoUpload(e.target.files)}
                            />

                            {/* Metadata fields */}
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="videoName">Video Title</Label>
                                    <Input
                                        id="videoName"
                                        value={formData.videoLecture?.name ?? ""}
                                        onChange={(e) => updateVideoField("name", e.target.value)}
                                        placeholder="e.g. Introduction Overview"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="videoMeta">
                                        Notes{" "}
                                        <span className="text-muted-foreground text-xs font-normal">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="videoMeta"
                                        value={formData.videoLecture?.metadata ?? ""}
                                        onChange={(e) => updateVideoField("metadata", e.target.value)}
                                        placeholder="Any notes about this video..."
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            {formData.videoLecture?.versions?.[0]?.url ? (
                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/30">
                                        <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm text-foreground truncate flex-1">
                                            {formData.videoLecture.versions[0].url.split("/").pop()}
                                        </span>
                                        <Badge variant="secondary" className="text-xs uppercase shrink-0">
                                            S3
                                        </Badge>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-border/50 bg-black">
                                        <video
                                            controls
                                            src={formData.videoLecture.versions[0].url}
                                            className="w-full max-h-72"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Video className="h-7 w-7" />}
                                    text="No video uploaded yet"
                                />
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: Assessment ── */}
                    {step === 4 && (
                        <div className="grid gap-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Chapter Assessment
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Optional — add a quiz that learners must pass to complete this chapter
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addQuestion}
                                    className="gap-1.5 h-8 shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Question
                                </Button>
                            </div>

                            {formData.assessment.questions.length > 0 && (
                                <>
                                    {/* Assessment meta */}
                                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 grid gap-4">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="assessName">
                                                Assessment Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="assessName"
                                                value={formData.assessment.name}
                                                onChange={(e) => updateAssessmentField("name", e.target.value)}
                                                placeholder="e.g. Chapter 1 Quiz"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="passingScore">
                                                Passing Score (%)
                                            </Label>
                                            <Input
                                                id="passingScore"
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={formData.assessment.passingScore}
                                                onChange={(e) =>
                                                    updateAssessmentField("passingScore", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        {/* Reviewer */}
                                        <div className="grid gap-1.5">
                                            <Label>
                                                Reviewer{" "}
                                                {formData.assessment.questions.some(q => q.type === "TEXT") ? (
                                                    <span className="text-red-500">*</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs font-normal">
                                                        (optional)
                                                    </span>
                                                )}
                                            </Label>
                                            {formData.assessment.reviewer ? (
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background">
                                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="text-sm flex-1">
                                                        {formData.assessment.reviewer.firstName}{" "}
                                                        {formData.assessment.reviewer.lastName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                                        {formData.assessment.reviewer.email}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setReviewer(null)}
                                                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        value={reviewerQuery}
                                                        onChange={(e) => setReviewerQuery(e.target.value)}
                                                        placeholder="Search users by name…"
                                                        className="pl-8 text-sm"
                                                    />
                                                    {(reviewerLoading || reviewerOptions.length > 0) && (
                                                        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                                                            {reviewerLoading && (
                                                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    Searching…
                                                                </div>
                                                            )}
                                                            {!reviewerLoading && reviewerOptions.map((r) => (
                                                                <button
                                                                    key={r._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setReviewer(r);
                                                                        setReviewerQuery("");
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                                                                >
                                                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                    <span className="flex-1 font-medium">
                                                                        {r.firstName} {r.lastName}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                                                        {r.email}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                            {!reviewerLoading && reviewerOptions.length === 0 && reviewerQuery.trim() && (
                                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                                    No HR users found
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />
                                </>
                            )}

                            {formData.assessment.questions.length === 0 && (
                                <EmptyState
                                    icon={<ClipboardList className="h-7 w-7" />}
                                    text='No questions added — click "Add Question" to create an assessment'
                                />
                            )}

                            {/* Question list */}
                            <div className="grid gap-4">
                                {formData.assessment.questions.map((q, qIdx) => (
                                    <div
                                        key={qIdx}
                                        className="border border-border rounded-xl p-4 bg-muted/10 grid gap-4"
                                    >
                                        {/* Question header */}
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                                                Q{qIdx + 1}
                                            </Badge>
                                            <div className="flex items-center gap-2">
                                                {/* Type toggle */}
                                                <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuestion(qIdx, { type: "MCQ" })}
                                                        className={cn(
                                                            "px-2.5 py-1 transition-colors",
                                                            q.type === "MCQ"
                                                                ? "bg-primary text-primary-foreground"
                                                                : "text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        MCQ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuestion(qIdx, { type: "TEXT" })}
                                                        className={cn(
                                                            "px-2.5 py-1 transition-colors",
                                                            q.type === "TEXT"
                                                                ? "bg-primary text-primary-foreground"
                                                                : "text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        Text
                                                    </button>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeQuestion(qIdx)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Question text */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Question</Label>
                                            <Textarea
                                                value={q.question}
                                                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                                                placeholder="Enter your question..."
                                                rows={2}
                                                className="resize-none text-sm"
                                            />
                                        </div>

                                        {/* Marks */}
                                        <div className="grid gap-1.5 w-24">
                                            <Label className="text-xs">Marks</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={q.marks}
                                                onChange={(e) =>
                                                    updateQuestion(qIdx, { marks: Math.max(1, Number(e.target.value)) })
                                                }
                                                className="text-sm h-8"
                                            />
                                        </div>

                                        {/* MCQ options */}
                                        {q.type === "MCQ" && (
                                            <div className="grid gap-3">
                                                {/* Options list */}
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">Options</Label>
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                                                                {String.fromCharCode(65 + oIdx)}.
                                                            </span>
                                                            <Input
                                                                value={opt}
                                                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                                className="flex-1 h-8 text-sm"
                                                            />
                                                            {q.options.length > 2 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeOption(qIdx, oIdx)}
                                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addOption(qIdx)}
                                                        className="gap-1.5 h-7 text-xs justify-start text-muted-foreground w-fit"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Add Option
                                                    </Button>
                                                </div>

                                                {/* Correct answer selector */}
                                                <div className="grid gap-1.5">
                                                    <Label className="text-xs">
                                                        Correct Answer <span className="text-red-500">*</span>
                                                    </Label>
                                                    <select
                                                        value={q.correctAnswer}
                                                        onChange={(e) =>
                                                            updateQuestion(qIdx, { correctAnswer: e.target.value })
                                                        }
                                                        className={cn(
                                                            "h-8 w-full rounded-md border bg-background px-2.5 text-sm transition-colors",
                                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                                            q.correctAnswer
                                                                ? "border-green-500 text-foreground"
                                                                : "border-border text-muted-foreground"
                                                        )}
                                                    >
                                                        <option value="">— select correct answer —</option>
                                                        {q.options
                                                            .filter((o) => o.trim() !== "")
                                                            .map((o, i) => (
                                                                <option key={i} value={o}>
                                                                    {String.fromCharCode(65 + q.options.indexOf(o))}. {o}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    {q.correctAnswer && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                            <Check className="h-3 w-3" />
                                                            {q.correctAnswer}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* TEXT type hint */}
                                        {q.type === "TEXT" && (
                                            <p className="text-xs text-muted-foreground italic">
                                                Learners will provide a written answer — graded manually.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {formData.assessment.questions.length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addQuestion}
                                    className="gap-1.5 w-fit"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Another Question
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Footer navigation */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={step === 1 ? () => { clearSession(); navigate(`/training/${lessonId}`); } : goBack}
                        disabled={loading}
                        className="gap-1.5"
                    >
                        {step === 1 ? (
                            "Cancel"
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </>
                        )}
                    </Button>

                    {/* Step dots */}
                    <div className="flex items-center gap-1.5">
                        {STEP_META.map((s) => (
                            <div
                                key={s.step}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    step === s.step
                                        ? "w-6 bg-primary"
                                        : step > s.step
                                            ? "w-3 bg-primary/50"
                                            : "w-3 bg-border"
                                )}
                            />
                        ))}
                    </div>

                    {step < TOTAL_STEPS ? (
                        <Button type="button" onClick={goNext} className="gap-1.5">
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                            className="gap-1.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Create Chapter
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground">
            <div className="opacity-30">{icon}</div>
            <p className="text-xs text-center px-4">{text}</p>
        </div>
    );
}

function UploadedFileRow({
    url,
    ext,
    onRemove,
}: {
    url: string;
    ext: string;
    onRemove: () => void;
}) {
    const filename = url.split("/").pop() ?? url;
    return (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/30 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground truncate flex-1 min-w-0">{filename}</span>
            <Badge variant="secondary" className="text-xs uppercase shrink-0">
                {ext}
            </Badge>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
