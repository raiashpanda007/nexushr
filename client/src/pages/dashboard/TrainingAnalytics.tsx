import { BarChart2, ChevronLeft, BookOpen, Users, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2, GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";
import { useTrainingAnalytics } from "@/hooks/Training/useTrainingAnalytics";
import type { LessonStudentRow, StudentLessonRow, ChapterAnalyticsRow, AssessmentAttempt } from "@/types/training";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const truncateLabel = (v: string, max = 14) =>
    v && v.length > max ? `${v.slice(0, max)}…` : v;

const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">Completed</Badge>;
    if (status === "in_progress") return <Badge className="bg-amber-500/15 text-amber-600 border-amber-200 hover:bg-amber-500/20">In Progress</Badge>;
    return <Badge variant="secondary">Not Started</Badge>;
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#94a3b8"];

const StatCard = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) => (
    <Card className="border-border/40">
        <CardContent className="p-5 flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 shrink-0">
                <Icon className="h-6 w-6 text-foreground/70" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </CardContent>
    </Card>
);

// ─── Overview View ─────────────────────────────────────────────────────────────

const OverviewView = ({
    overview,
    loading,
    onLessonClick,
}: {
    overview: ReturnType<typeof useTrainingAnalytics>["overview"];
    loading: boolean;
    onLessonClick: (id: string, name: string) => void;
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!overview) return null;

    const { summary, lessons } = overview;

    const barData = lessons.map((l) => ({
        name: truncateLabel(l.lessonName, 12),
        fullName: l.lessonName,
        completion: l.avgCompletionPct,
        enrolled: l.enrolledCount,
    }));

    return (
        <div className="flex flex-col gap-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="Total Lessons" value={summary.totalLessons} />
                <StatCard icon={Users} label="Total Enrollments" value={summary.totalEnrollments} />
                <StatCard icon={TrendingUp} label="Avg Completion" value={`${summary.avgCompletionRate}%`} />
                <StatCard icon={Clock} label="Pending Reviews" value={summary.totalPendingReviews} />
            </div>

            {/* Chart */}
            {lessons.length > 0 && (
                <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Completion Rate per Lesson</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-sm">
                                                <p className="font-medium mb-1">{d.fullName}</p>
                                                <p className="text-muted-foreground">Avg Completion: <span className="font-semibold text-foreground">{d.completion}%</span></p>
                                                <p className="text-muted-foreground">Enrolled: <span className="font-semibold text-foreground">{d.enrolled}</span></p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Lessons Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="pl-5">#</TableHead>
                                <TableHead>Lesson</TableHead>
                                <TableHead className="text-right">Enrolled</TableHead>
                                <TableHead className="text-right">Completed</TableHead>
                                <TableHead className="text-right">In Progress</TableHead>
                                <TableHead className="text-right">Avg Completion</TableHead>
                                <TableHead className="text-right pr-5">Pending Reviews</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lessons.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                        No data yet
                                    </TableCell>
                                </TableRow>
                            )}
                            {lessons.map((l, i) => (
                                <TableRow
                                    key={String(l.lessonId)}
                                    className="cursor-pointer hover:bg-muted/20 transition-colors"
                                    onClick={() => onLessonClick(String(l.lessonId), l.lessonName)}
                                >
                                    <TableCell className="pl-5 text-muted-foreground text-sm">{i + 1}</TableCell>
                                    <TableCell className="font-medium">{l.lessonName}</TableCell>
                                    <TableCell className="text-right">{l.enrolledCount}</TableCell>
                                    <TableCell className="text-right text-emerald-600 font-medium">{l.completedCount}</TableCell>
                                    <TableCell className="text-right text-amber-600">{l.inProgressCount}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-semibold">{l.avgCompletionPct}%</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-5">
                                        {l.pendingReviewsCount > 0
                                            ? <span className="text-destructive font-semibold">{l.pendingReviewsCount}</span>
                                            : <span className="text-muted-foreground">0</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

// ─── Lesson Detail View ────────────────────────────────────────────────────────

const LessonDetailView = ({
    lessonData,
    loading,
    onStudentClick,
}: {
    lessonData: ReturnType<typeof useTrainingAnalytics>["lessonData"];
    loading: boolean;
    onStudentClick: (id: string, firstName: string, lastName: string) => void;
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!lessonData) return null;

    const { lesson, students } = lessonData;

    const completed = students.filter((s) => s.status === "completed").length;
    const inProgress = students.filter((s) => s.status === "in_progress").length;
    const notStarted = students.filter((s) => s.status === "not_started").length;
    const totalPending = students.reduce((s, r) => s + r.pendingReviews, 0);

    const pieData = [
        { name: "Completed", value: completed },
        { name: "In Progress", value: inProgress },
        { name: "Not Started", value: notStarted },
    ].filter((d) => d.value > 0);

    const topStudents = [...students]
        .sort((a, b) => b.completionPct - a.completionPct)
        .slice(0, 10)
        .map((s) => ({
            name: truncateLabel(`${s.firstName} ${s.lastName}`, 14),
            fullName: `${s.firstName} ${s.lastName}`,
            completion: s.completionPct,
            avgScore: s.avgAssessmentScore,
        }));

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Enrolled" value={students.length} sub={`${lesson.totalChapters} chapters`} />
                <StatCard icon={CheckCircle2} label="Completed" value={completed} />
                <StatCard icon={TrendingUp} label="In Progress" value={inProgress} />
                <StatCard icon={AlertCircle} label="Pending Reviews" value={totalPending} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                {pieData.length > 0 && (
                    <Card className="border-border/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Student Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center py-4">
                            <PieChart width={260} height={200}>
                                <Pie
                                    data={pieData}
                                    cx={130}
                                    cy={90}
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, idx) => (
                                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [`${v} students`]} />
                            </PieChart>
                        </CardContent>
                    </Card>
                )}

                {/* Top students bar chart */}
                {topStudents.length > 0 && (
                    <Card className="border-border/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Top Students by Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={topStudents} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-sm">
                                                    <p className="font-medium mb-1">{d.fullName}</p>
                                                    <p className="text-muted-foreground">Completion: <span className="font-semibold text-foreground">{d.completion}%</span></p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Students table */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Students</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="pl-5">#</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Chapters Done</TableHead>
                                <TableHead className="text-right">Completion</TableHead>
                                <TableHead className="text-right">Avg Score</TableHead>
                                <TableHead className="text-right pr-5">Pending</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                        No students enrolled
                                    </TableCell>
                                </TableRow>
                            )}
                            {students.map((s: LessonStudentRow, i) => (
                                <TableRow
                                    key={s.userId}
                                    className="cursor-pointer hover:bg-muted/20 transition-colors"
                                    onClick={() => onStudentClick(s.userId, s.firstName, s.lastName)}
                                >
                                    <TableCell className="pl-5 text-muted-foreground text-sm">{i + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{s.firstName} {s.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{s.email}</div>
                                    </TableCell>
                                    <TableCell>{statusBadge(s.status)}</TableCell>
                                    <TableCell className="text-right">{s.completedCount} / {lesson.totalChapters}</TableCell>
                                    <TableCell className="text-right font-semibold">{s.completionPct}%</TableCell>
                                    <TableCell className="text-right">{s.avgAssessmentScore > 0 ? `${s.avgAssessmentScore}%` : "—"}</TableCell>
                                    <TableCell className="text-right pr-5">
                                        {s.pendingReviews > 0
                                            ? <span className="text-destructive font-semibold">{s.pendingReviews}</span>
                                            : <span className="text-muted-foreground">0</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

// ─── Chapter Attempts ─────────────────────────────────────────────────────────

const AttemptRow = ({ attempt, idx }: { attempt: AssessmentAttempt; idx: number }) => (
    <div className="flex items-center gap-3 text-sm py-1">
        <span className="text-muted-foreground w-6 text-right shrink-0">#{idx + 1}</span>
        <span className="text-muted-foreground text-xs w-24 shrink-0">
            {attempt.attemptedAt ? format(new Date(attempt.attemptedAt), "MMM d, yyyy") : "—"}
        </span>
        <span className="font-medium w-16 shrink-0">{attempt.percentage}%</span>
        <span className="text-xs text-muted-foreground w-20 shrink-0">{attempt.score}/{attempt.totalScore} marks</span>
        <span className="shrink-0">
            {attempt.passed
                ? <span className="text-emerald-600 text-xs font-semibold">Passed</span>
                : <span className="text-red-500 text-xs font-semibold">Failed</span>}
        </span>
        {attempt.reviewStatus === "pending_review" && (
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 shrink-0">Pending Review</Badge>
        )}
    </div>
);

const ChapterRow = ({ chapter, rank }: { chapter: ChapterAnalyticsRow; rank: number }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-border/40 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
            >
                <span className="text-muted-foreground text-sm w-5 shrink-0">{rank}</span>
                <span className="font-medium flex-1 text-sm">{chapter.name}</span>
                <span className="text-xs text-muted-foreground mr-2">{chapter.attempts.length} attempt{chapter.attempts.length !== 1 ? "s" : ""}</span>
                {statusBadge(chapter.status)}
                {chapter.bestScore !== null && (
                    <span className="text-xs font-semibold ml-2">Best: {chapter.bestScore}%</span>
                )}
                <ChevronLeft className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "-rotate-90" : "rotate-180"}`} />
            </button>
            {open && (
                <div className="px-4 py-3 space-y-1 bg-background/60">
                    {chapter.attempts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-1">No attempts yet</p>
                    ) : (
                        chapter.attempts.map((a, i) => <AttemptRow key={i} attempt={a} idx={i} />)
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Student Detail View ───────────────────────────────────────────────────────

const StudentDetailView = ({
    studentAllLessons,
    studentAllLessonsLoading,
    studentLessonDetail,
    studentLessonDetailLoading,
    studentTab,
    studentTabLesson,
    allLessons,
    onTabChange,
    onLessonSelect,
}: {
    studentAllLessons: StudentLessonRow[];
    studentAllLessonsLoading: boolean;
    studentLessonDetail: ReturnType<typeof useTrainingAnalytics>["studentLessonDetail"];
    studentLessonDetailLoading: boolean;
    studentTab: "all-lessons" | "single-lesson";
    studentTabLesson: ReturnType<typeof useTrainingAnalytics>["studentTabLesson"];
    allLessons: ReturnType<typeof useTrainingAnalytics>["allLessons"];
    onTabChange: (tab: "all-lessons" | "single-lesson") => void;
    onLessonSelect: (id: string) => void;
}) => {
    const completed = studentAllLessons.filter((l) => l.status === "completed").length;
    const avgScore = studentAllLessons.length
        ? Math.round(studentAllLessons.reduce((s, l) => s + (l.bestScore || 0), 0) / studentAllLessons.length)
        : 0;

    const barData = studentAllLessons.map((l) => ({
        name: truncateLabel(l.lessonName, 12),
        fullName: l.lessonName,
        completion: l.completionPct,
    }));

    return (
        <Tabs value={studentTab} onValueChange={(v) => onTabChange(v as "all-lessons" | "single-lesson")}>
            <TabsList className="mb-4">
                <TabsTrigger value="all-lessons">All Lessons</TabsTrigger>
                <TabsTrigger value="single-lesson">Single Lesson</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: All Lessons ── */}
            <TabsContent value="all-lessons" className="flex flex-col gap-6 mt-0">
                {studentAllLessonsLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard icon={GraduationCap} label="Enrolled Lessons" value={studentAllLessons.length} />
                            <StatCard icon={CheckCircle2} label="Completed" value={completed} />
                            <StatCard icon={TrendingUp} label="Avg Best Score" value={`${avgScore}%`} />
                        </div>

                        {barData.length > 0 && (
                            <Card className="border-border/40">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-semibold">Completion per Lesson</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-sm">
                                                            <p className="font-medium mb-1">{d.fullName}</p>
                                                            <p className="text-muted-foreground">Completion: <span className="font-semibold text-foreground">{d.completion}%</span></p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-border/40">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Lessons</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="pl-5">#</TableHead>
                                            <TableHead>Lesson</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Progress</TableHead>
                                            <TableHead className="text-right pr-5">Best Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentAllLessons.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                                    No lessons enrolled
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {studentAllLessons.map((l: StudentLessonRow, i) => (
                                            <TableRow key={l.lessonId}>
                                                <TableCell className="pl-5 text-muted-foreground text-sm">{i + 1}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{l.lessonName}</div>
                                                    <div className="text-xs text-muted-foreground">{l.lessonDescription}</div>
                                                </TableCell>
                                                <TableCell>{statusBadge(l.status)}</TableCell>
                                                <TableCell className="text-right">{l.completedCount}/{l.chaptersCount} ({l.completionPct}%)</TableCell>
                                                <TableCell className="text-right pr-5 font-semibold">
                                                    {l.bestScore > 0 ? `${l.bestScore}%` : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </TabsContent>

            {/* ── Tab 2: Single Lesson ── */}
            <TabsContent value="single-lesson" className="flex flex-col gap-4 mt-0">
                <div className="flex items-center gap-3">
                    <Select
                        value={studentTabLesson?.id ?? ""}
                        onValueChange={onLessonSelect}
                    >
                        <SelectTrigger className="w-72">
                            <SelectValue placeholder="Select a lesson…" />
                        </SelectTrigger>
                        <SelectContent>
                            {allLessons.map((l) => (
                                <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {studentLessonDetailLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!studentLessonDetailLoading && studentLessonDetail && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard icon={BookOpen} label="Total Chapters" value={studentLessonDetail.lesson.totalChapters} />
                            <StatCard icon={CheckCircle2} label="Completed" value={studentLessonDetail.completedCount} />
                            <StatCard icon={TrendingUp} label="Completion" value={`${studentLessonDetail.completionPct}%`} />
                        </div>

                        <div className="flex flex-col gap-2">
                            {studentLessonDetail.chapters.map((chapter: ChapterAnalyticsRow) => (
                                <ChapterRow key={chapter.chapterId} chapter={chapter} rank={chapter.rank} />
                            ))}
                        </div>
                    </div>
                )}

                {!studentLessonDetailLoading && !studentLessonDetail && studentTabLesson && (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        No progress data found for this lesson.
                    </div>
                )}

                {!studentTabLesson && (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        Select a lesson to view chapter-level progress.
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
};

// ─── Employee Analytics ────────────────────────────────────────────────────────

import { useState } from "react";
import { useEmployeeAnalytics } from "@/hooks/Training/useEmployeeAnalytics";

function EmployeeAnalyticsView() {
    const {
        tab,
        allLessonsProgress,
        allLessonsLoading,
        selectedLesson,
        lessonDetail,
        lessonDetailLoading,
        lessonsList,
        handleTabChange,
        handleLessonSelect,
    } = useEmployeeAnalytics();

    return (
        <StudentDetailView
            studentAllLessons={allLessonsProgress}
            studentAllLessonsLoading={allLessonsLoading}
            studentLessonDetail={lessonDetail}
            studentLessonDetailLoading={lessonDetailLoading}
            studentTab={tab}
            studentTabLesson={selectedLesson}
            allLessons={lessonsList}
            onTabChange={handleTabChange}
            onLessonSelect={handleLessonSelect}
        />
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TrainingAnalytics() {
    const { userDetails } = useAppSelector((state) => state.userState);
    const isHR = userDetails?.role?.toUpperCase() === "HR";

    const {
        view,
        overview,
        overviewLoading,
        selectedLesson,
        lessonData,
        lessonLoading,
        selectedStudent,
        studentAllLessons,
        studentAllLessonsLoading,
        studentLessonDetail,
        studentLessonDetailLoading,
        studentTabLesson,
        studentTab,
        allLessons,
        navigateToLesson,
        navigateToStudent,
        navigateBack,
        handleStudentTabChange,
        handleStudentTabLessonChange,
    } = useTrainingAnalytics();

    // Employee view
    if (!isHR) {
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
                <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
                    <div className="relative flex items-center gap-4 z-10">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <BarChart2 className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">My Training Analytics</h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                                Track your training progress and assessment scores
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden p-6">
                    <EmployeeAnalyticsView />
                </div>
            </div>
        );
    }

    // Breadcrumb
    const breadcrumb: { label: string; onClick?: () => void }[] = [
        { label: "Overview", onClick: view !== "overview" ? navigateBack : undefined },
    ];
    if (view === "lesson" || view === "student") {
        breadcrumb.push({
            label: selectedLesson?.name ?? "Lesson",
            onClick: view === "student" && selectedLesson ? navigateBack : undefined,
        });
    }
    if (view === "student") {
        breadcrumb.push({ label: `${selectedStudent?.firstName} ${selectedStudent?.lastName}` });
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <BarChart2 className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                Training Analytics
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                                Track training performance and completion records
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breadcrumb + Back */}
            {view !== "overview" && (
                <div className="flex items-center gap-2 text-sm">
                    <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <span className="text-border/80">|</span>
                    {breadcrumb.map((b, i) => (
                        <span key={i} className="flex items-center gap-2">
                            {i > 0 && <span className="text-muted-foreground">/</span>}
                            {b.onClick ? (
                                <button onClick={b.onClick} className="text-muted-foreground hover:text-foreground transition-colors">
                                    {b.label}
                                </button>
                            ) : (
                                <span className="font-medium text-foreground">{b.label}</span>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* Content area */}
            <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden p-6">
                {/* Sub-header for lesson/student views */}
                {view === "lesson" && selectedLesson && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-foreground">{selectedLesson.name}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Student progress overview</p>
                    </div>
                )}
                {view === "student" && selectedStudent && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-foreground">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Individual training progress</p>
                    </div>
                )}

                {view === "overview" && (
                    <OverviewView
                        overview={overview}
                        loading={overviewLoading}
                        onLessonClick={navigateToLesson}
                    />
                )}

                {view === "lesson" && (
                    <LessonDetailView
                        lessonData={lessonData}
                        loading={lessonLoading}
                        onStudentClick={navigateToStudent}
                    />
                )}

                {view === "student" && selectedStudent && (
                    <StudentDetailView
                        studentAllLessons={studentAllLessons}
                        studentAllLessonsLoading={studentAllLessonsLoading}
                        studentLessonDetail={studentLessonDetail}
                        studentLessonDetailLoading={studentLessonDetailLoading}
                        studentTab={studentTab}
                        studentTabLesson={studentTabLesson}
                        allLessons={allLessons}
                        onTabChange={handleStudentTabChange}
                        onLessonSelect={handleStudentTabLessonChange}
                    />
                )}
            </div>
        </div>
    );
}
