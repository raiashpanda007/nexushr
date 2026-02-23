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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSalaryId, setCurrentSalaryId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SalaryFormData>({
        userId: '',
        baseSalary: 0,
        hra: 0,
        lta: 0
    });

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
        isModalOpen,
        isEditMode,
        formData,
        handleOpenModal,
        handleCloseModal,
        handleSubmit,
        handleDelete,
        filteredSalaries
    };
}
