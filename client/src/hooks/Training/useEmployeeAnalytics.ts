import { useState, useEffect, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";
import type { StudentLessonRow, StudentLessonDetailData, Lesson } from "@/types/training";

export function useEmployeeAnalytics() {
    const [allLessonsProgress, setAllLessonsProgress] = useState<StudentLessonRow[]>([]);
    const [allLessonsLoading, setAllLessonsLoading] = useState(false);

    const [selectedLesson, setSelectedLesson] = useState<{ id: string; name: string } | null>(null);
    const [lessonDetail, setLessonDetail] = useState<StudentLessonDetailData | null>(null);
    const [lessonDetailLoading, setLessonDetailLoading] = useState(false);

    const [lessonsList, setLessonsList] = useState<Lesson[]>([]);
    const [lessonsListLoading, setLessonsListLoading] = useState(false);

    const [tab, setTab] = useState<"all-lessons" | "single-lesson">("all-lessons");

    const fetchAllProgress = useCallback(async () => {
        setAllLessonsLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress", "me"],
            });
            if (result.ok) {
                const data = result.response.data;
                setAllLessonsProgress(Array.isArray(data) ? data : []);
            } else {
                toast.error(result.response.message || "Failed to fetch your progress");
            }
        } catch {
            toast.error("Failed to fetch your progress");
        } finally {
            setAllLessonsLoading(false);
        }
    }, []);

    const fetchLessonDetail = useCallback(async (lessonId: string) => {
        setLessonDetailLoading(true);
        setLessonDetail(null);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "progress", "me"],
                queryParams: { lessonId },
            });
            if (result.ok) {
                setLessonDetail(result.response.data);
            } else {
                toast.error(result.response.message || "Failed to fetch lesson detail");
            }
        } catch {
            toast.error("Failed to fetch lesson detail");
        } finally {
            setLessonDetailLoading(false);
        }
    }, []);

    const fetchLessonsList = useCallback(async () => {
        setLessonsListLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "lessons"],
                queryParams: { limit: "100" },
            });
            if (result.ok) {
                const data = result.response.data;
                setLessonsList(Array.isArray(data) ? data : data?.data ?? []);
            }
        } catch {
            // silent
        } finally {
            setLessonsListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllProgress();
        fetchLessonsList();
    }, [fetchAllProgress, fetchLessonsList]);

    const handleTabChange = (next: "all-lessons" | "single-lesson") => {
        setTab(next);
        // Auto-fetch if a lesson is already selected and detail not loaded
        if (next === "single-lesson" && selectedLesson && !lessonDetail) {
            fetchLessonDetail(selectedLesson.id);
        }
    };

    const handleLessonSelect = (lessonId: string) => {
        const lesson = lessonsList.find((l) => l._id === lessonId);
        if (!lesson) return;
        setSelectedLesson({ id: lesson._id, name: lesson.name });
        fetchLessonDetail(lessonId);
    };

    return {
        tab,
        allLessonsProgress,
        allLessonsLoading,
        selectedLesson,
        lessonDetail,
        lessonDetailLoading,
        lessonsList,
        lessonsListLoading,
        handleTabChange,
        handleLessonSelect,
    };
}
