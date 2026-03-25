import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Lesson } from "@/types/training";
import { toast } from "sonner";

export function useTraining() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchLessons = async (currentPage = 1) => {
        setLoading(true);
        try {
            const queryParams: Record<string, string> = {
                page: currentPage.toString(),
                limit: limit.toString(),
            };

            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "training", "lessons"],
                queryParams,
            });

            if (result.ok) {
                const data = result.response.data;
                if (data?.data) {
                    setLessons(data.data);
                    setTotal(data.total ?? data.data.length);
                } else if (Array.isArray(data)) {
                    setLessons(data);
                    setTotal(data.length);
                }
            } else {
                toast.error(result.response.message || "Failed to fetch courses");
            }
        } catch {
            toast.error("An error occurred while fetching courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLessons(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleDeleteLesson = async (id: string) => {
        try {
            const result = await ApiCaller<null, null>({
                requestType: "DELETE",
                paths: ["api", "v1", "training", "lessons", id],
            });
            if (result.ok) {
                toast.success("Course deleted successfully");
                fetchLessons(page);
            } else {
                toast.error(result.response.message || "Failed to delete course");
            }
        } catch {
            toast.error("An error occurred while deleting the course");
        }
    };

    const handleCreateCourse = () => setIsCreateModalOpen(true);
    const handleModalClose = () => setIsCreateModalOpen(false);
    const handleSuccess = () => {
        handleModalClose();
        fetchLessons(1);
        setPage(1);
    };

    const filteredLessons = searchQuery
        ? lessons.filter(
              (l) =>
                  l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : lessons;

    return {
        lessons: filteredLessons,
        loading,
        page,
        setPage,
        total,
        limit,
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        handleCreateCourse,
        handleDeleteLesson,
        handleModalClose,
        handleSuccess,
    };
}
