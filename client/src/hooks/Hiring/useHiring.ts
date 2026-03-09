import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Opening } from "@/types/hiring";
import { toast } from "sonner";

export function useHiring() {
    const [openings, setOpenings] = useState<Opening[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);

    const fetchOpenings = async (currentPage = 1) => {
        setLoading(true);
        try {
            const queryParams: Record<string, string> = {
                page: currentPage.toString(),
                limit: limit.toString(),
            };
            if (statusFilter) queryParams.status = statusFilter;
            if (departmentFilter) queryParams.departmentId = departmentFilter;

            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "hiring", "openings"],
                queryParams,
            });

            if (result.ok) {
                const data = result.response.data;
                if (Array.isArray(data)) {
                    setOpenings(data);
                    setTotal(data.length);
                } else if (data?.data) {
                    setOpenings(data.data);
                    setTotal(data.total ?? data.data.length);
                }
            } else {
                toast.error(result.response.message || "Failed to fetch openings");
            }
        } catch (err) {
            console.error("Error fetching openings:", err);
            toast.error("An error occurred while fetching openings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpenings(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, departmentFilter]);

    const handleCreateOpening = () => {
        setSelectedOpening(null);
        setIsCreateModalOpen(true);
    };

    const handleViewOpening = (opening: Opening) => {
        setSelectedOpening(opening);
    };

    const handleDeleteOpening = async (id: string) => {
        try {
            const result = await ApiCaller<null, null>({
                requestType: "DELETE",
                paths: ["api", "v1", "hiring", "openings", id],
            });
            if (result.ok) {
                toast.success("Opening deleted successfully");
                fetchOpenings(page);
            } else {
                toast.error(result.response.message || "Failed to delete opening");
            }
        } catch (err) {
            toast.error("An error occurred while deleting the opening");
        }
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setSelectedOpening(null);
    };

    const handleSuccess = () => {
        handleModalClose();
        fetchOpenings(1);
        setPage(1);
    };

    return {
        openings,
        loading,
        page,
        setPage,
        total,
        limit,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        departmentFilter,
        setDepartmentFilter,
        isCreateModalOpen,
        selectedOpening,
        handleCreateOpening,
        handleViewOpening,
        handleDeleteOpening,
        handleModalClose,
        handleSuccess,
    };
}
