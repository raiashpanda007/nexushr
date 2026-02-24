import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmployeeTable from "@/components/employee/EmployeeTable";
import EmployeeModal from "@/components/employee/EmployeeModal";
import { useEmployee } from "@/hooks/Employee/useEmployee";
import { Users, Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function Employee() {
    const {
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
    } = useEmployee();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-background to-cyan-50/30 p-6 space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-linear-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Employee Management</h1>
                            <p className="text-white/70 text-sm mt-0.5">Manage your organization's workforce</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                            <Input
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-9 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                            />
                        </div>
                        <Button
                            onClick={handleAddEmployee}
                            className="bg-white text-blue-700 hover:bg-white/90 font-semibold shadow-md gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Employee
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-xl border">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                        <p className="text-sm font-medium">Loading employees...</p>
                    </div>
                ) : (
                    <>
                        <EmployeeTable
                            employees={employees}
                            onEdit={handleEditEmployee}
                            startIndex={(page - 1) * limit + 1}
                        />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span> employees
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Previous
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground px-2">
                                        {page} / {totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || totalPages === 0}
                                        className="gap-1"
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
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
