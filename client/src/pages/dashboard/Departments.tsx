
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

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const result = await ApiCaller<null, Department[]>({
                requestType: "GET",
                paths: ["api", "v1", "departments"],
            });

            if (result.ok) {
                setDepartments(result.response.data || []);
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
        fetchDepartments();
    }, []);

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
                fetchDepartments();
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
        fetchDepartments();
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
                    <DepartmentTable departments={departments} onEdit={handleEditDept} onDelete={handleDeleteDept} />
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
