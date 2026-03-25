import { useState } from "react";
import { useEnrollStudents } from "@/hooks/Training/useEnrollStudents";
import type { EnrolledStudent } from "@/types/training";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    X,
    Search,
    Loader2,
    UserPlus,
    Users,
    Trash2,
    CheckCircle2,
    BarChart2,
    Check,
} from "lucide-react";

const LEVELS = [1, 2, 3, 4, 5];
const LEVEL_LABELS: Record<number, string> = {
    1: "Beginner",
    2: "Elementary",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
};

interface Props {
    lessonId: string;
    lessonName: string;
    onClose: () => void;
}

function Avatar({ student }: { student: EnrolledStudent }) {
    if (student.profilePhoto) {
        return (
            <img
                src={student.profilePhoto}
                alt=""
                className="h-8 w-8 rounded-full object-cover shrink-0"
            />
        );
    }
    const initials = `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();
    return (
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
        </div>
    );
}

export default function EnrollStudentsModal({ lessonId, lessonName, onClose }: Props) {
    const [tab, setTab] = useState<"enrolled" | "search" | "skill">("enrolled");
    // Selected student IDs for bulk enroll
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const {
        enrolled,
        enrolledLoading,
        enrolledPage,
        enrolledTotal,
        enrolledPageLimit,
        fetchEnrolled,
        removeStudent,
        enrolling,
        addStudents,
        searchQuery,
        setSearchQuery,
        searchResults,
        searching,
        skillSearch,
        setSkillSearch,
        skills,
        skillsLoading,
        selectedSkillId,
        setSelectedSkillId,
        maxLevel,
        setMaxLevel,
        enrollingBySkill,
        enrollBySkill,
    } = useEnrollStudents(lessonId);

    const enrolledTotalPages = Math.ceil(enrolledTotal / enrolledPageLimit);
    const enrolledIds = new Set(enrolled.map((e) => e._id));

    const toggleSelect = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const handleEnroll = async (ids: string[]) => {
        const ok = await addStudents(ids);
        if (ok) setSelected(new Set());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Enroll Students</h2>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {lessonName}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/50 px-5">
                    {(
                        [
                            { key: "enrolled", label: "Enrolled", icon: Users },
                            { key: "search", label: "Search", icon: Search },
                            { key: "skill", label: "By Skill Level", icon: BarChart2 },
                        ] as const
                    ).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors -mb-px",
                                tab === key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                            {key === "enrolled" && enrolledTotal > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                    {enrolledTotal}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 min-h-0">
                    {/* ── Tab: Enrolled ── */}
                    {tab === "enrolled" && (
                        <div className="flex flex-col gap-3">
                            {enrolledLoading ? (
                                <div className="flex justify-center py-12 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : enrolled.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Users className="h-8 w-8 mb-2 opacity-30" />
                                    <p className="text-sm">No students enrolled yet</p>
                                    <p className="text-xs mt-1">Use Search or By Skill Level to add students</p>
                                </div>
                            ) : (
                                <>
                                    {enrolled.map((s) => (
                                        <div
                                            key={s._id}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
                                        >
                                            <Avatar student={s} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {s.firstName} {s.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {s.email}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeStudent(s._id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    {enrolledTotalPages > 1 && (
                                        <div className="flex items-center justify-between pt-1">
                                            <p className="text-xs text-muted-foreground">
                                                Page {enrolledPage} of {enrolledTotalPages}
                                            </p>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    disabled={enrolledPage <= 1 || enrolledLoading}
                                                    onClick={() => fetchEnrolled(enrolledPage - 1)}
                                                >
                                                    Prev
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    disabled={enrolledPage >= enrolledTotalPages || enrolledLoading}
                                                    onClick={() => fetchEnrolled(enrolledPage + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Search ── */}
                    {tab === "search" && (
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search employee by name or email..."
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>

                            {/* Bulk enroll button */}
                            {selected.size > 0 && (
                                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
                                    <p className="text-sm font-medium text-foreground">
                                        {selected.size} selected
                                    </p>
                                    <Button
                                        size="sm"
                                        className="gap-1.5 h-8"
                                        disabled={enrolling}
                                        onClick={() => handleEnroll(Array.from(selected))}
                                    >
                                        {enrolling ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <UserPlus className="h-3.5 w-3.5" />
                                        )}
                                        Enroll Selected
                                    </Button>
                                </div>
                            )}

                            {/* Results */}
                            {searching ? (
                                <div className="flex justify-center py-10 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            ) : searchQuery && searchResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No employees found
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {searchResults.map((emp) => {
                                        const isEnrolled = enrolledIds.has(emp._id);
                                        const isSelected = selected.has(emp._id);
                                        return (
                                            <button
                                                key={emp._id}
                                                type="button"
                                                disabled={isEnrolled}
                                                onClick={() => !isEnrolled && toggleSelect(emp._id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                                                    isEnrolled
                                                        ? "border-border/30 bg-muted/10 opacity-60 cursor-not-allowed"
                                                        : isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border/50 hover:bg-muted/30 cursor-pointer"
                                                )}
                                            >
                                                <Avatar student={emp} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {emp.firstName} {emp.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {emp.email}
                                                        {emp.deptId && (
                                                            <> · {(emp.deptId as any).name}</>
                                                        )}
                                                    </p>
                                                </div>
                                                {isEnrolled ? (
                                                    <Badge variant="secondary" className="text-xs shrink-0 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Enrolled
                                                    </Badge>
                                                ) : isSelected ? (
                                                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                    </div>
                                                ) : (
                                                    <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: By Skill Level ── */}
                    {tab === "skill" && (
                        <div className="flex flex-col gap-5">
                            <p className="text-xs text-muted-foreground">
                                Find all employees who have a skill rated at or below the selected
                                level and enroll them in this course.
                            </p>

                            {/* Skill search */}
                            <div className="grid gap-1.5">
                                <label className="text-xs font-medium text-foreground">
                                    Skill
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        value={skillSearch}
                                        onChange={(e) => {
                                            setSkillSearch(e.target.value);
                                            setSelectedSkillId("");
                                        }}
                                        placeholder="Search skills..."
                                        className="pl-9"
                                    />
                                </div>
                                {skillsLoading && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Searching skills...
                                    </div>
                                )}
                                {skills.length > 0 && !selectedSkillId && (
                                    <div className="border border-border rounded-xl overflow-hidden mt-1">
                                        {skills.map((sk, i) => (
                                            <button
                                                key={sk._id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSkillId(sk._id);
                                                    setSkillSearch(sk.name);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-muted/40 transition-colors",
                                                    i > 0 && "border-t border-border/50"
                                                )}
                                            >
                                                <span className="font-medium text-foreground">{sk.name}</span>
                                                <span className="text-xs text-muted-foreground">{sk.category}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedSkillId && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                            {skillSearch}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSkillId("");
                                                    setSkillSearch("");
                                                }}
                                                className="ml-0.5 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Max level */}
                            <div className="grid gap-2">
                                <label className="text-xs font-medium text-foreground">
                                    Maximum Skill Level —{" "}
                                    <span className="text-primary">
                                        {maxLevel} · {LEVEL_LABELS[maxLevel]}
                                    </span>
                                </label>
                                <div className="flex gap-2">
                                    {LEVELS.map((lvl) => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setMaxLevel(lvl)}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors",
                                                maxLevel === lvl
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : lvl <= maxLevel
                                                    ? "border-primary/40 text-primary/80 bg-primary/5"
                                                    : "border-border text-muted-foreground hover:bg-muted/30"
                                            )}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Will match employees with this skill rated ≤ {maxLevel} ({LEVEL_LABELS[maxLevel]} and below)
                                </p>
                            </div>

                            <Button
                                type="button"
                                disabled={!selectedSkillId || enrollingBySkill}
                                onClick={enrollBySkill}
                                className="gap-1.5 w-fit"
                            >
                                {enrollingBySkill ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <UserPlus className="h-3.5 w-3.5" />
                                )}
                                Enroll All Matching Employees
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
