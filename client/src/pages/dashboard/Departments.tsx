
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DepartmentTable from "@/components/departments/DepartmentTable";
import DepartmentModal from "@/components/departments/DepartmentModal";
import ApiCaller from "@/utils/ApiCaller";

interface Department {
    _id: string;
    name: string;
    description: string;
}

export default function Departments() {
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
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "departments"],
                queryParams: { page: currentPage.toString(), limit: limit.toString() }
            });

            if (result.ok) {
                if (Array.isArray(result.response.data)) {
                    setDepartments(result.response.data);
                } else if (result.response.data?.data) {
                    setDepartments(result.response.data.data);
                    setTotal(result.response.data.total || 0);
                }
            } else {
                console.error("Failed to fetch departments:", result.response.message);
            }
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

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
                <Button onClick={handleAddDept}>Add Department</Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading departments...</div>
                ) : (
                    <>
                        <DepartmentTable departments={departments} onEdit={handleEditDept} onDelete={handleDeleteDept} />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
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
                                        onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                                        disabled={page === Math.ceil(total / limit) || Math.ceil(total / limit) === 0}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <DepartmentModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialData={selectedDept}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
