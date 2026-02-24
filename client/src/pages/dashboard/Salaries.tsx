import { Plus, Search, Wallet, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SalaryTable from '../../components/salaries/SalaryTable';
import SalaryModal from '../../components/salaries/SalaryModal';
import { useSalaries } from '@/hooks/Salaries/useSalaries';


const Salaries = () => {
    const {
        isHR,
        salaries,
        users,
        loading,
        actionLoading,
        searchTerm,
        handleSearch,
        page,
        setPage,
        total,
        limit,
        isModalOpen,
        isEditMode,
        formData,
        handleOpenModal,
        handleCloseModal,
        handleSubmit,
        handleDelete,
        filteredSalaries
    } = useSalaries();

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50/50 via-background to-teal-50/30 p-6 space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Employee Salaries</h1>
                            <p className="text-white/70 text-sm mt-0.5">Manage and view employee salary structures</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isHR && (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="w-64 pl-9 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                                    />
                                </div>
                                <Button
                                    onClick={() => handleOpenModal()}
                                    className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-md gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Salary
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-xl overflow-hidden">
                {loading && !salaries.length && !isModalOpen ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-xl border">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                        <p className="text-sm font-medium">Loading salary data...</p>
                    </div>
                ) : (
                    <>
                        <SalaryTable
                            salaries={filteredSalaries}
                            isHR={isHR}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                            loading={actionLoading}
                        />
                        {!loading && total > 0 && (
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

            {/* Create/Edit Modal */}
            <SalaryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                users={users}
                salaryData={isEditMode ? formData : null}
                onSubmit={handleSubmit}
                loading={actionLoading}
                isEditMode={isEditMode}
            />
        </div>
    );
};

export default Salaries;
