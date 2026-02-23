import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";

export interface Department {
    _id: string;
    name: string;
    description: string;
}

export function useDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchDepartments = async (currentPage = 1) => {
        setLoading(true);
        try {
            let apiDepartments: Department[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "departments"],
                    queryParams: { page: currentPage.toString(), limit: limit.toString() }
                });

                if (result.ok) {
                    if (Array.isArray(result.response.data)) {
                        apiDepartments = result.response.data;
                    } else if (result.response.data?.data) {
                        apiDepartments = result.response.data.data;
                        apiTotal = result.response.data.total || 0;
                    }
                } else {
                    console.error("Failed to fetch departments:", result.response.message);
                }
            }

            setDepartments(apiDepartments);
            setTotal(apiTotal);
        } catch (error) {
            console.error("Error fetching departments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments(page);
    }, [page]);

    const handleAddDept = () => {
        setSelectedDept(null);
        setIsModalOpen(true);
    };

    const handleEditDept = (dept: Department) => {
        setSelectedDept(dept);
        setIsModalOpen(true);
    };

    const handleDeleteDept = async (id: string) => {
        if (!confirm("Are you sure you want to delete this department?")) return;

        try {
            const result = await ApiCaller({
                requestType: "DELETE",
                paths: ["api", "v1", "departments", id],
            });
            if (result.ok) {
                fetchDepartments(page);
            } else {
                alert("Failed to delete: " + result.response.message);
            }
        } catch (error) {
            alert("Error deleting department");
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDept(null);
    };

    const handleSuccess = () => {
        fetchDepartments(page);
    };

    return {
        departments,
        isModalOpen,
        selectedDept,
        loading,
        page,
        setPage,
        total,
        limit,
        handleAddDept,
        handleEditDept,
        handleDeleteDept,
        handleModalClose,
        handleSuccess
    };
}
