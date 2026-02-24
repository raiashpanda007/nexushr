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
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchDepartments = async (currentPage = 1, query: string = "") => {
        setLoading(true);
        try {
            let apiDepartments: Department[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                if (query.trim()) {
                    const result = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "search", "departments"],
                        queryParams: { query: query.trim() }
                    });

                    if (result.ok) {
                        const responseData = result.response.data;
                        if (Array.isArray(responseData)) {
                            apiDepartments = responseData;
                        } else if (responseData && responseData.data) {
                            apiDepartments = responseData.data;
                        }
                        apiTotal = apiDepartments.length;
                    } else {
                        console.error("Failed to search departments:", result.response.message);
                    }
                } else {
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
        const timeoutId = setTimeout(() => {
            fetchDepartments(page, searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, searchQuery]);

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
                fetchDepartments(page, searchQuery);
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
        if (!selectedDept) {
            // New department created — go to page 1 so it appears at the top
            if (page !== 1) {
                setPage(1); // useEffect will trigger fetch for page 1
            } else {
                fetchDepartments(1, searchQuery);
            }
        } else {
            // Existing department edited — refresh current page
            fetchDepartments(page, searchQuery);
        }
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
        searchQuery,
        setSearchQuery,
        handleAddDept,
        handleEditDept,
        handleDeleteDept,
        handleModalClose,
        handleSuccess
    };
}
