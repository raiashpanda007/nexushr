import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee } from "@/types";


interface GetUsersResponse {
    data: Employee[];
    total: number;
    page: number;
    limit: number;
}

export function useEmployee() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    const [searchQuery, setSearchQuery] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchEmployees = async (currentPage: number, query: string = "") => {
        setLoading(true);

        try {
            let apiEmployees: Employee[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                if (query.trim()) {
                    const result = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "search", "users"],
                        queryParams: { query: query.trim() }
                    });

                    if (result.ok) {
                        const responseData = result.response.data;
                        if (Array.isArray(responseData)) {
                            apiEmployees = responseData;
                        } else if (responseData && responseData.data) {
                            apiEmployees = responseData.data;
                        }
                        apiTotal = apiEmployees.length;
                    } else {
                        console.error("Failed to search employees:", result.response.message);
                    }
                } else {
                    const result = await ApiCaller<null, GetUsersResponse>({
                        requestType: "GET",
                        paths: ["api", "v1", "user", "get-users"],
                        queryParams: { page: currentPage.toString(), limit: limit.toString() }
                    });

                    if (result.ok) {
                        const responseData = result.response.data as GetUsersResponse;
                        if (Array.isArray(responseData)) {
                            apiEmployees = responseData;
                        } else if (responseData && responseData.data) {
                            apiEmployees = responseData.data;
                            apiTotal = responseData.total || 0;
                        }
                    } else {
                        console.error("Failed to fetch employees:", result.response.message);
                    }
                }
            }

            setEmployees(apiEmployees);
            setTotal(apiTotal);
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEmployees(page, searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, searchQuery]);

    const handleAddEmployee = () => {
        setSelectedEmployee(null);
        setIsModalOpen(true);
    };

    const handleEditEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleSuccess = () => {
        fetchEmployees(page, searchQuery);
    };

    const totalPages = Math.ceil(total / limit);

    return {
        employees,
        page,
        setPage,
        total,
        limit,
        searchQuery,
        setSearchQuery,
        isModalOpen,
        selectedEmployee,
        loading,
        handleAddEmployee,
        handleEditEmployee,
        handleModalClose,
        handleSuccess,
        totalPages
    };
}
