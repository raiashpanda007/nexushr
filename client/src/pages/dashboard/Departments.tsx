import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DepartmentTable from "@/components/departments/DepartmentTable";
import DepartmentModal from "@/components/departments/DepartmentModal";
import { useDepartments } from "@/hooks/Departments/useDepartments";

export default function Departments() {
    const {
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
    } = useDepartments();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search departments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                    />
                    <Button onClick={handleAddDept}>Add Department</Button>
                </div>
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
