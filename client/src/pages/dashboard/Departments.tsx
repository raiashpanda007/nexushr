import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DepartmentTable from "@/components/departments/DepartmentTable";
import DepartmentModal from "@/components/departments/DepartmentModal";
import { useDepartments } from "@/hooks/Departments/useDepartments";
import { Building2, Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

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

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-background to-violet-50/30 p-6 space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Department Management</h1>
                            <p className="text-white/70 text-sm mt-0.5">Organize your teams effectively</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                            <Input
                                placeholder="Search departments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-9 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                            />
                        </div>
                        <Button
                            onClick={handleAddDept}
                            className="bg-white text-indigo-700 hover:bg-white/90 font-semibold shadow-md gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Department
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-xl border">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                        <p className="text-sm font-medium">Loading departments...</p>
                    </div>
                ) : (
                    <>
                        <DepartmentTable departments={departments} onEdit={handleEditDept} onDelete={handleDeleteDept} />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span>
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

            <DepartmentModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialData={selectedDept}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
