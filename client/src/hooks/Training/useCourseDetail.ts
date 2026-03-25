import { useState, useEffect, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { LessonDetail, Chapter } from "@/types/training";
import { toast } from "sonner";

export function useCourseDetail(lessonId: string | undefined) {
    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [chapterLoading, setChapterLoading] = useState(false);

    const refetch = useCallback(async () => {
        if (!lessonId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await ApiCaller<null, LessonDetail>({
                requestType: "GET",
                paths: ["api", "v1", "training", "lessons", lessonId],
            });
            if (result.ok) {
                setLesson(result.response.data);
            } else {
                setError(
                    (result.response as any)?.message ?? "Failed to fetch course"
                );
            }
        } catch {
            setError("Failed to fetch course");
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    /**
     * Select a chapter. For employees, calls MarkOpened.
     * If the chapter has assessments, fetches the full chapter detail
     * so assessment question data is available.
     */
    const selectChapter = useCallback(
        async (chapter: Chapter, isEmployee: boolean) => {
            // Optimistically show the chapter while we load
            setSelectedChapter(chapter);

            // Mark as opened (employee only)
            if (isEmployee && lessonId) {
                await ApiCaller<{ lessonId: string }, unknown>({
                    requestType: "POST",
                    paths: ["api", "v1", "training", "chapters", chapter._id, "open"],
                    body: { lessonId },
                }).catch(() => {
                    // Non-fatal — progress update failure shouldn't block viewing
                });
            }

            // If the chapter has assessments, fetch full chapter detail
            // (lesson detail doesn't expand assessment question data)
            if (chapter.assessments && chapter.assessments.length > 0) {
                setChapterLoading(true);
                try {
                    const result = await ApiCaller<null, Chapter>({
                        requestType: "GET",
                        paths: ["api", "v1", "training", "chapters", chapter._id],
                    });
                    if (result.ok) {
                        setSelectedChapter(result.response.data);
                    }
                } catch {
                    toast.error("Failed to load assessment details");
                } finally {
                    setChapterLoading(false);
                }
            }
        },
        [lessonId]
    );

    const deleteChapter = useCallback(async (chapterId: string) => {
        const res = await ApiCaller<null, null>({
            requestType: "DELETE",
            paths: ["api", "v1", "training", "chapters", chapterId],
        });
        if (res.ok) {
            toast.success("Chapter deleted");
            setLesson((prev) => {
                if (!prev) return prev;
                return { ...prev, chapters: prev.chapters.filter((c) => c._id !== chapterId) };
            });
            setSelectedChapter((prev) => (prev?._id === chapterId ? null : prev));
        } else {
            toast.error((res.response as any)?.message ?? "Failed to delete chapter");
        }
    }, []);

    return {
        lesson,
        loading,
        error,
        refetch,
        selectedChapter,
        setSelectedChapter,
        selectChapter,
        chapterLoading,
        deleteChapter,
    };
}
