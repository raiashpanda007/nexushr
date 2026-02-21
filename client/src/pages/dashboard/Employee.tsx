import { Button } from "@/components/ui/button";
import EmployeeTable from "@/components/employee/EmployeeTable";
import EmployeeModal from "@/components/employee/EmployeeModal";
import { useEmployee } from "@/hooks/Employee/useEmployee";

export default function Employee() {
    const {
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
    } = useEmployee();

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
