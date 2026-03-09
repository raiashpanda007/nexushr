import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useCreateOpeningModal } from "@/hooks/hiring/useCreateOpeningModal";
import {
    Loader2,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    Check,
    Building2,
    UserCircle2,
    BriefcaseBusiness,
    Layers,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateOpeningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const STEP_META = [
    {
        step: 1,
        label: "Basic Info",
        icon: BriefcaseBusiness,
        desc: "Title, department & hiring manager",
    },
    {
        step: 2,
        label: "Rounds",
        icon: Layers,
        desc: "Interview stages & test rounds",
    },
    {
        step: 3,
        label: "Questions",
        icon: HelpCircle,
        desc: "Screening questions for applicants",
    },
];

export default function CreateOpeningModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateOpeningModalProps) {
    const {
        step,
        formData,
        loading,
        error,
        fieldErrors,
        deptQuery,
        setDeptQuery,
        deptResults,
        deptLoading,
        isDeptOpen,
        setIsDeptOpen,
        selectDept,
        managerQuery,
        setManagerQuery,
        managerResults,
        managerLoading,
        isManagerOpen,
        setIsManagerOpen,
        selectManager,
        handleStep1Change,
        handleStatusChange,
        addRound,
        removeRound,
        updateRound,
        addQuestion,
        removeQuestion,
        updateQuestion,
        addOption,
        updateOption,
        removeOption,
        goNext,
        goBack,
        handleSubmit,
    } = useCreateOpeningModal({ isOpen, onSuccess });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-155 max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-5 w-5 text-primary" />
                        Create Job Opening
                    </DialogTitle>
                    <DialogDescription>
                        Complete all steps to publish a new job opening
                    </DialogDescription>
                </DialogHeader>

                {/* Step indicator */}
                <div className="flex items-center gap-0 mt-1 mb-4">
                    {STEP_META.map((s, i) => {
                        const Icon = s.icon;
                        const done = step > s.step;
                        const active = step === s.step;
                        return (
                            <div key={s.step} className="flex items-center flex-1 min-w-0">
                                <div
                                    className={cn(
                                        "flex flex-col items-center gap-1 flex-1 min-w-0",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all",
                                            done
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : active
                                                ? "border-primary text-primary bg-primary/10"
                                                : "border-border text-muted-foreground bg-muted/30",
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
                                            "text-[11px] font-medium text-center leading-tight",
                                            active ? "text-foreground" : "text-muted-foreground",
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEP_META.length - 1 && (
                                    <div
                                        className={cn(
                                            "h-0.5 w-8 mx-1 rounded-full transition-all",
                                            step > s.step ? "bg-primary" : "bg-border",
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Error banner */}
                {error && (
                    <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-2.5 rounded-md -mt-1 mb-1">
                        {error}
                    </p>
                )}

                {/* ─── STEP 1 ─── */}
                {step === 1 && (
                    <div className="grid gap-4">
                        {/* Title */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="title">
                                Job Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleStep1Change}
                                placeholder="e.g. Senior Backend Engineer"
                            />
                            {fieldErrors.title && (
                                <p className="text-red-500 text-xs">{fieldErrors.title}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="description">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleStep1Change}
                                placeholder="Describe the role, responsibilities and expectations..."
                                rows={3}
                            />
                            {fieldErrors.description && (
                                <p className="text-red-500 text-xs">{fieldErrors.description}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div className="grid gap-1.5">
                            <Label>
                                Status <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger
                                    className={cn(fieldErrors.status && "border-red-400")}
                                >
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                    <SelectItem value="PAUSED">Paused</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldErrors.status && (
                                <p className="text-red-500 text-xs">{fieldErrors.status}</p>
                            )}
                        </div>

                        {/* Department */}
                        <div className="grid gap-1.5">
                            <Label>
                                Department <span className="text-red-500">*</span>
                            </Label>
                            <Popover open={isDeptOpen} onOpenChange={setIsDeptOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between font-normal",
                                            !formData.departmentId && "text-muted-foreground",
                                            fieldErrors.departmentId && "border-red-400",
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                            {formData.departmentName || "Search department..."}
                                        </span>
                                        <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search department..."
                                            value={deptQuery}
                                            onValueChange={setDeptQuery}
                                        />
                                        <CommandList>
                                            {deptLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No departments found</CommandEmpty>
                                                    <CommandGroup>
                                                        {deptResults.map((dept) => (
                                                            <CommandItem
                                                                key={dept._id}
                                                                value={dept.name}
                                                                onSelect={() => selectDept(dept)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.departmentId === dept._id
                                                                            ? "opacity-100"
                                                                            : "opacity-0",
                                                                    )}
                                                                />
                                                                {dept.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {fieldErrors.departmentId && (
                                <p className="text-red-500 text-xs">{fieldErrors.departmentId}</p>
                            )}
                        </div>

                        {/* Note */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Input
                                id="note"
                                name="note"
                                value={formData.note}
                                onChange={handleStep1Change}
                                placeholder="Any internal notes about this opening..."
                            />
                        </div>

                        {/* Hiring Manager */}
                        <div className="grid gap-1.5">
                            <Label>
                                Hiring Manager <span className="text-red-500">*</span>
                            </Label>
                            {!formData.departmentId && (
                                <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-dashed border-border">
                                    Select a department first to pick a hiring manager
                                </p>
                            )}
                            {formData.departmentId && (
                                <Popover
                                    open={isManagerOpen}
                                    onOpenChange={setIsManagerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-normal",
                                                !formData.HiringManager && "text-muted-foreground",
                                                fieldErrors.HiringManager && "border-red-400",
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                <UserCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                {formData.HiringManagerName || "Search hiring manager..."}
                                            </span>
                                            <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search by name..."
                                                value={managerQuery}
                                                onValueChange={setManagerQuery}
                                            />
                                            <CommandList>
                                                {managerLoading ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No employees found in this department</CommandEmpty>
                                                        <CommandGroup>
                                                            {managerResults.map((emp) => (
                                                                <CommandItem
                                                                    key={emp._id}
                                                                    value={`${emp.firstName} ${emp.lastName}`}
                                                                    onSelect={() => selectManager(emp)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.HiringManager === emp._id
                                                                                ? "opacity-100"
                                                                                : "opacity-0",
                                                                        )}
                                                                    />
                                                                    <div>
                                                                        <p className="text-sm font-medium">
                                                                            {emp.firstName} {emp.lastName}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {emp.email}
                                                                        </p>
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
                            )}
                            {fieldErrors.HiringManager && (
                                <p className="text-red-500 text-xs">{fieldErrors.HiringManager}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: ROUNDS ─── */}
                {step === 2 && (
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Interview Rounds
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Define the stages candidates go through
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRound}
                                className="gap-1.5 h-8"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Round
                            </Button>
                        </div>

                        {formData.rounds.length === 0 && (
                            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground">
                                <Layers className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No rounds added yet</p>
                                <p className="text-xs">You can skip this step or add rounds above</p>
                            </div>
                        )}

                        {formData.rounds.map((round, idx) => (
                            <div
                                key={idx}
                                className="border border-border rounded-xl p-4 grid gap-3 bg-muted/20 relative group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Badge
                                        variant="outline"
                                        className="text-xs font-mono border-border text-muted-foreground"
                                    >
                                        Round {idx + 1}
                                    </Badge>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRound(idx)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">
                                            Round Name <span className="text-red-400">*</span>
                                        </Label>
                                        <Input
                                            value={round.name}
                                            onChange={(e) =>
                                                updateRound(idx, "name", e.target.value)
                                            }
                                            placeholder="e.g. Technical Interview"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">
                                            Type <span className="text-red-400">*</span>
                                        </Label>
                                        <Select
                                            value={round.type}
                                            onValueChange={(v) => updateRound(idx, "type", v)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INTERVIEW">Interview</SelectItem>
                                                <SelectItem value="TEST">Test</SelectItem>
                                                <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                        Description
                                    </Label>
                                    <Textarea
                                        value={round.description}
                                        onChange={(e) =>
                                            updateRound(idx, "description", e.target.value)
                                        }
                                        placeholder="Describe what happens in this round..."
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── STEP 3: QUESTIONS ─── */}
                {step === 3 && (
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Screening Questions
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Questions applicants answer when applying
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addQuestion}
                                className="gap-1.5 h-8"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Question
                            </Button>
                        </div>

                        {formData.questions.length === 0 && (
                            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground">
                                <HelpCircle className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No questions added yet</p>
                                <p className="text-xs">You can skip this step or add questions above</p>
                            </div>
                        )}

                        {formData.questions.map((q, qIdx) => (
                            <div
                                key={qIdx}
                                className="border border-border rounded-xl p-4 grid gap-3 bg-muted/20"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Badge
                                        variant="outline"
                                        className="text-xs font-mono border-border text-muted-foreground"
                                    >
                                        Q{qIdx + 1}
                                    </Badge>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeQuestion(qIdx)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                        Question <span className="text-red-400">*</span>
                                    </Label>
                                    <Textarea
                                        value={q.question}
                                        onChange={(e) =>
                                            updateQuestion(qIdx, "question", e.target.value)
                                        }
                                        placeholder="Enter your question..."
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                        Answer Type <span className="text-red-400">*</span>
                                    </Label>
                                    <Select
                                        value={q.type}
                                        onValueChange={(v) => updateQuestion(qIdx, "type", v)}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TEXT">Text (free response)</SelectItem>
                                            <SelectItem value="MULTIPLE_CHOICE">
                                                Multiple Choice
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Options for MCQ */}
                                {q.type === "MULTIPLE_CHOICE" && (
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-muted-foreground">
                                                Options <span className="text-red-400">*</span>{" "}
                                                <span className="text-muted-foreground/70">
                                                    (min. 2)
                                                </span>
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => addOption(qIdx)}
                                                className="h-6 gap-1 text-xs text-primary hover:text-primary"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Add option
                                            </Button>
                                        </div>
                                        {q.options.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">
                                                Click "Add option" to start adding choices
                                            </p>
                                        )}
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <div className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-[10px] text-muted-foreground font-medium shrink-0">
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                <Input
                                                    value={opt}
                                                    onChange={(e) =>
                                                        updateOption(qIdx, oIdx, e.target.value)
                                                    }
                                                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                    className="h-8 text-sm flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeOption(qIdx, oIdx)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={step === 1 ? onClose : goBack}
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
                                        : "w-3 bg-border",
                                )}
                            />
                        ))}
                    </div>

                    {step < 3 ? (
                        <Button type="button" onClick={goNext} className="gap-1.5">
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSubmit}
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
                                    Create Opening
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
