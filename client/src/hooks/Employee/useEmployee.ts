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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchEmployees = async (currentPage: number) => {
        setLoading(true);

        try {
            const result = await ApiCaller<null, GetUsersResponse>({
                requestType: "GET",
                paths: ["api", "v1", "user", "get-users"],
                queryParams: { page: currentPage.toString(), limit: limit.toString() }
            });

            if (result.ok) {
                const responseData = result.response.data as GetUsersResponse;
                if (Array.isArray(responseData)) {
                    setEmployees(responseData);
                } else if (responseData && responseData.data) {
                    setEmployees(responseData.data);
                    setTotal(responseData.total || 0);
                }
            } else {
                console.error("Failed to fetch employees:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees(page);
    }, [page]);

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
        fetchEmployees(page);
    };

    const totalPages = Math.ceil(total / limit);

    return {
        employees,
        page,
        setPage,
        total,
        limit,
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
