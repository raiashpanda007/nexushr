import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import EmployeeTable from "@/components/employee/EmployeeTable";
import EmployeeModal from "@/components/employee/EmployeeModal";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee } from "@/types";

export default function Employee() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const result = await ApiCaller<null, Employee[]>({
                requestType: "GET",
                paths: ["api", "v1", "user", "get-users"],
            });

            if (result.ok) {
                setEmployees(result.response.data);
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
        fetchEmployees();
    }, []);

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
        fetchEmployees();
    };

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
                    <EmployeeTable employees={employees} onEdit={handleEditEmployee} />
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
