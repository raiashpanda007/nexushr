import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ApiCaller from '@/utils/ApiCaller';
import type { RootState } from '@/store';

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

export function useSalaries() {
    const { userDetails } = useSelector((state: RootState) => state.userState);
    const isHR = userDetails?.role === 'HR';

    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentSalaryId, setCurrentSalaryId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<{ baseSalary: number; hra: number; lta: number } | null>(null);
    const [editEmployeeName, setEditEmployeeName] = useState('');

    const fetchSalaries = async (currentPage = 1) => {
        try {
            let apiSalaries: Salary[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const { response } = await ApiCaller<any, any>({
                    requestType: 'GET',
                    paths: ['api', 'v1', 'salaries'],
                    queryParams: { page: currentPage.toString(), limit: limit.toString() }
                });
                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        apiSalaries = response.data;
                    } else if (response.data.data) {
                        apiSalaries = response.data.data;
                        apiTotal = response.data.total || 0;
                    }
                }
            }

            setSalaries(apiSalaries);
            setTotal(apiTotal);
        } catch (error) {
            console.error('Error fetching salaries:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { response } = await ApiCaller<any, any>({
                requestType: 'GET',
                paths: ['api', 'v1', 'user', 'get-users']
            });
            if (response?.data) {
                // Backend returns { data: users[], total, page, limit }
                const usersData = response.data.data || response.data;
                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                }
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleOpenEditModal = (salary: Salary) => {
        setCurrentSalaryId(salary._id);
        setEditFormData({
            baseSalary: salary.base,
            hra: salary.hra,
            lta: salary.lta,
        });
        setEditEmployeeName(
            `${salary.userId?.firstName || ''} ${salary.userId?.lastName || ''}`.trim()
        );
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentSalaryId(null);
        setEditFormData(null);
        setEditEmployeeName('');
    };

    const handleCreateSubmit = async (data: SalaryFormData) => {
        setActionLoading(true);
        try {
            const result = await ApiCaller({
                requestType: 'POST',
                paths: ['api', 'v1', 'salaries'],
                body: data,
            });

            if (!result.ok) {
                throw new Error(result.response?.message || 'Failed to create salary');
            }

            // Reset to page 1 so the new salary appears at the top
            setPage(1);
            await fetchSalaries(1);
            handleCloseCreateModal();
        } catch (error: any) {
            console.error('Error creating salary:', error);
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditSubmit = async (data: { baseSalary: number; hra: number; lta: number }) => {
        if (!currentSalaryId) return;
        setActionLoading(true);
        try {
            const result = await ApiCaller({
                requestType: 'PUT',
                paths: ['api', 'v1', 'salaries', currentSalaryId],
                body: data,
            });

            if (!result.ok) {
                throw new Error(result.response?.message || 'Failed to update salary');
            }

            await fetchSalaries();
            handleCloseEditModal();
        } catch (error: any) {
            console.error('Error updating salary:', error);
            throw error;
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

    const filteredSalaries = salaries.filter(salary => {
        if (!searchTerm) return true;
        const fullName = `${salary.userId?.firstName || ''} ${salary.userId?.lastName || ''}`.toLowerCase();
        const email = salary.userId?.email?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
    });

    return {
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
        isCreateModalOpen,
        isEditModalOpen,
        editFormData,
        editEmployeeName,
        handleOpenCreateModal,
        handleCloseCreateModal,
        handleOpenEditModal,
        handleCloseEditModal,
        handleCreateSubmit,
        handleEditSubmit,
        handleDelete,
        filteredSalaries
    };
}
