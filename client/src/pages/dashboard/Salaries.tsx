import { Plus, Search } from 'lucide-react';
import Loader from '../../components/Loader';
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

    if (loading && !salaries.length && !isModalOpen) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold">
                        Employee Salaries
                    </h1>
                    <p className="text-gray-500 mt-1">Manage and view employee salary structures</p>
                </div>

                {isHR && (
                    <Button
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={20} />
                        <span>Add Salary</span>
                    </Button>
                )}
            </div>

            {/* Search and Stats */}
            {isHR && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Search by employee name or email..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="pl-10 border-gray-200 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            )}

            {/* Content Table */}
            <div className="bg-white rounded-lg shadow">
                <SalaryTable
                    salaries={filteredSalaries}
                    isHR={isHR}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    loading={actionLoading}
                />
                {!loading && total > 0 && (
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
