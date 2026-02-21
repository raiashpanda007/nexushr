import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import EmployeeTable from "@/components/employee/EmployeeTable";
import EmployeeModal from "@/components/employee/EmployeeModal";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee } from "@/types";

interface GetUsersResponse {
    data: Employee[];
    total: number;
    page: number;
    limit: number;
}

export default function Employee() {
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
                // Handle case where backend might not be fully updated and returns an array
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

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
                <Button onClick={handleAddEmployee}>Add Employee</Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading employees...</div>
                ) : (
                    <>
                        <EmployeeTable
                            employees={employees}
                            onEdit={handleEditEmployee}
                            startIndex={(page - 1) * limit + 1}
                        />
                        {total > 0 && (
                            <div className="p-4 border-t flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} employees
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || totalPages === 0}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <EmployeeModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialData={selectedEmployee}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
