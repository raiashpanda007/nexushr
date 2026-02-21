import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search } from 'lucide-react';
import ApiCaller from '../../utils/ApiCaller';
import type { RootState } from '@/store';
import Loader from '../../components/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SalaryTable from '../../components/salaries/SalaryTable';
import SalaryModal from '../../components/salaries/SalaryModal';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deptId?: {
        _id: string;
        name: string;
    };
}

interface Salary {
    _id: string;
    userId: User;
    base: number;
    hra: number;
    lta: number;
    createdAt: string;
}

interface SalaryFormData {
    userId: string;
    baseSalary: number;
    hra: number;
    lta: number;
}

const Salaries = () => {
    // Redux State
    const { userDetails } = useSelector((state: RootState) => state.userState);
    const isHR = userDetails?.role === 'HR';

    // Local State
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSalaryId, setCurrentSalaryId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SalaryFormData>({
        userId: '',
        baseSalary: 0,
        hra: 0,
        lta: 0
    });

    // Fetch Data
    const fetchSalaries = async (currentPage = 1) => {
        try {
            const { response } = await ApiCaller<any, any>({
                requestType: 'GET',
                paths: ['api', 'v1', 'salaries'],
                queryParams: { page: currentPage.toString(), limit: limit.toString() }
            });
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    setSalaries(response.data);
                } else if (response.data.data) {
                    setSalaries(response.data.data);
                    setTotal(response.data.total || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching salaries:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { response } = await ApiCaller<any, User[]>({
                requestType: 'GET',
                paths: ['api', 'v1', 'user', 'get-users']
            });
            if (response?.data && Array.isArray(response.data)) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const initData = async () => {
        setLoading(true);
        await Promise.all([
            fetchSalaries(page),
            isHR && users.length === 0 ? fetchUsers() : Promise.resolve()
        ]);
        setLoading(false);
    };

    useEffect(() => {
        initData();
    }, [userDetails, page]);

    // Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenModal = (salary?: Salary) => {
        if (salary) {
            setIsEditMode(true);
            setCurrentSalaryId(salary._id);
            setFormData({
                userId: salary.userId._id,
                baseSalary: salary.base,
                hra: salary.hra,
                lta: salary.lta
            });
        } else {
            setIsEditMode(false);
            setCurrentSalaryId(null);
            setFormData({
                userId: '',
                baseSalary: 0,
                hra: 0,
                lta: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentSalaryId(null);
    };

    const handleSubmit = async (data: SalaryFormData) => {
        setActionLoading(true);
        try {
            if (isEditMode && currentSalaryId) {
                await ApiCaller({
                    requestType: 'PUT',
                    paths: ['api', 'v1', 'salaries', currentSalaryId],
                    body: data
                });
            } else {
                await ApiCaller({
                    requestType: 'POST',
                    paths: ['api', 'v1', 'salaries'],
                    body: data
                });
            }
            await fetchSalaries();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving salary:', error);
            alert('Failed to save salary. Please check your inputs.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this salary record?')) return;

        setActionLoading(true);
        try {
            await ApiCaller({
                requestType: 'DELETE',
                paths: ['api', 'v1', 'salaries', id]
            });
            await fetchSalaries();
        } catch (error) {
            console.error('Error deleting salary:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Filter Salaries
    const filteredSalaries = salaries.filter(salary => {
        if (!searchTerm) return true;
        const fullName = `${salary.userId?.firstName || ''} ${salary.userId?.lastName || ''}`.toLowerCase();
        const email = salary.userId?.email?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
    });

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
