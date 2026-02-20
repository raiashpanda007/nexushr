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
    const fetchSalaries = async () => {
        try {
            const { response } = await ApiCaller<any, Salary[]>({
                requestType: 'GET',
                paths: ['api', 'v1', 'salaries']
            });
            if (response?.data && Array.isArray(response.data)) {
                setSalaries(response.data);
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
            fetchSalaries(),
            isHR ? fetchUsers() : Promise.resolve()
        ]);
        setLoading(false);
    };

    useEffect(() => {
        initData();
    }, [userDetails]);

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
            <SalaryTable
                salaries={filteredSalaries}
                isHR={isHR}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                loading={actionLoading}
            />

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
