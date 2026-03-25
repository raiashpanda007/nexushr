import { useState, useEffect, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";
import type {
    OverviewData,
    LessonAnalyticsData,
    StudentLessonRow,
    StudentLessonDetailData,
    Lesson,
} from "@/types/training";

export type AnalyticsView = "overview" | "lesson" | "student";

export interface SelectedLesson {
    id: string;
    name: string;
}

export interface SelectedStudent {
    id: string;
    firstName: string;
    lastName: string;
}

export function useTrainingAnalytics() {
    const [view, setView] = useState<AnalyticsView>("overview");

    // Overview
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(false);

    // Lesson detail
    const [selectedLesson, setSelectedLesson] = useState<SelectedLesson | null>(null);
    const [lessonData, setLessonData] = useState<LessonAnalyticsData | null>(null);
    const [lessonLoading, setLessonLoading] = useState(false);

    // Student detail
    const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
    const [studentAllLessons, setStudentAllLessons] = useState<StudentLessonRow[]>([]);
    const [studentAllLessonsLoading, setStudentAllLessonsLoading] = useState(false);

    // Student single-lesson detail (tab 2)
    const [studentLessonDetail, setStudentLessonDetail] = useState<StudentLessonDetailData | null>(null);
    const [studentLessonDetailLoading, setStudentLessonDetailLoading] = useState(false);
    // The lesson selected in tab 2 of student view
    const [studentTabLesson, setStudentTabLesson] = useState<SelectedLesson | null>(null);

    // Lessons list for the lesson selector in student tab 2
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [allLessonsLoading, setAllLessonsLoading] = useState(false);

    // Student detail active tab
    const [studentTab, setStudentTab] = useState<"all-lessons" | "single-lesson">("all-lessons");

    const fetchOverview = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress", "overview"],
            });
            if (result.ok) {
                setOverview(result.response.data);
            } else {
                toast.error(result.response.message || "Failed to fetch overview");
            }
        } catch {
            toast.error("Failed to fetch training overview");
        } finally {
            setOverviewLoading(false);
        }
    }, []);

    const fetchLessonAnalytics = useCallback(async (lessonId: string) => {
        setLessonLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress"],
                queryParams: { lessonId },
            });
            if (result.ok) {
                setLessonData(result.response.data);
            } else {
                toast.error(result.response.message || "Failed to fetch lesson analytics");
            }
        } catch {
            toast.error("Failed to fetch lesson analytics");
        } finally {
            setLessonLoading(false);
        }
    }, []);

    const fetchStudentAllLessons = useCallback(async (studentId: string) => {
        setStudentAllLessonsLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress"],
                queryParams: { studentId },
            });
            if (result.ok) {
                setStudentAllLessons(result.response.data ?? []);
            } else {
                toast.error(result.response.message || "Failed to fetch student analytics");
            }
        } catch {
            toast.error("Failed to fetch student analytics");
        } finally {
            setStudentAllLessonsLoading(false);
        }
    }, []);

    const fetchStudentLessonDetail = useCallback(async (studentId: string, lessonId: string) => {
        setStudentLessonDetailLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress"],
                queryParams: { studentId, lessonId },
            });
            if (result.ok) {
                setStudentLessonDetail(result.response.data);
            } else {
                toast.error(result.response.message || "Failed to fetch lesson detail");
            }
        } catch {
            toast.error("Failed to fetch lesson detail");
        } finally {
            setStudentLessonDetailLoading(false);
        }
    }, []);

    const fetchAllLessons = useCallback(async () => {
        setAllLessonsLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "lessons"],
                queryParams: { limit: "100" },
            });
            if (result.ok) {
                const data = result.response.data;
                setAllLessons(Array.isArray(data) ? data : data?.data ?? []);
            }
        } catch {
            // silent
        } finally {
            setAllLessonsLoading(false);
        }
    }, []);

    // Load overview on mount
    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const navigateToLesson = (lessonId: string, lessonName: string) => {
        setSelectedLesson({ id: lessonId, name: lessonName });
        setLessonData(null);
        setView("lesson");
        fetchLessonAnalytics(lessonId);
    };

    const navigateToStudent = (studentId: string, firstName: string, lastName: string) => {
        setSelectedStudent({ id: studentId, firstName, lastName });
        setStudentAllLessons([]);
        setStudentLessonDetail(null);
        setStudentTab("all-lessons");
        // Pre-fill tab 2 lesson if coming from lesson view
        if (selectedLesson) {
            setStudentTabLesson(selectedLesson);
        }
        setView("student");
        fetchStudentAllLessons(studentId);
        fetchAllLessons();
    };

    const navigateBack = () => {
        if (view === "student") {
            if (selectedLesson) {
                setView("lesson");
            } else {
                setView("overview");
            }
        } else if (view === "lesson") {
            setView("overview");
            setSelectedLesson(null);
        }
    };

    // When student tab changes to single-lesson and we have a lesson selected, fetch detail
    const handleStudentTabChange = (tab: "all-lessons" | "single-lesson") => {
        setStudentTab(tab);
        if (tab === "single-lesson" && studentTabLesson && selectedStudent) {
            fetchStudentLessonDetail(selectedStudent.id, studentTabLesson.id);
        }
    };

    const handleStudentTabLessonChange = (lessonId: string) => {
        const lesson = allLessons.find((l) => l._id === lessonId);
        if (!lesson || !selectedStudent) return;
        const sl = { id: lesson._id, name: lesson.name };
        setStudentTabLesson(sl);
        setStudentLessonDetail(null);
        fetchStudentLessonDetail(selectedStudent.id, lessonId);
    };

    return {
        view,
        // Overview
        overview,
        overviewLoading,
        // Lesson
        selectedLesson,
        lessonData,
        lessonLoading,
        // Student
        selectedStudent,
        studentAllLessons,
        studentAllLessonsLoading,
        studentLessonDetail,
        studentLessonDetailLoading,
        studentTabLesson,
        studentTab,
        allLessons,
        allLessonsLoading,
        // Actions
        navigateToLesson,
        navigateToStudent,
        navigateBack,
        handleStudentTabChange,
        handleStudentTabLessonChange,
    };
}
