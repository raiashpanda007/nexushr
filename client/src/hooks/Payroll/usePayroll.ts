import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ApiCaller from '@/utils/ApiCaller';
import type { RootState } from '@/store';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
}

interface Salary {
    _id: string;
    userId: User | string;
    base: number;
    hra: number;
    lta: number;
}

export interface PayrollItem {
    _id: string;
    user: string;
    salary: any;
    bonus: { reason: string; amount: number }[];
    deduction: { reason: string; amount: number }[];
    createdAt: string;
}

export function usePayroll() {
    const { userDetails } = useSelector((state: RootState) => state.userState);
    const isHR = userDetails?.role === 'HR';

    const [users, setUsers] = useState<User[]>([]);
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<string>('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchUsers = async () => {
        if (!isHR) return;
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

    const fetchSalaries = async () => {
        if (!isHR) return;
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

    const fetchPayrolls = async (currentPage = 1) => {
        try {
            const { response } = await ApiCaller<any, any>({
                requestType: 'GET',
                paths: ['api', 'v1', 'payroll'],
                queryParams: { page: currentPage.toString(), limit: limit.toString() }
            });
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    setPayrolls(response.data);
                } else if (response.data.data) {
                    setPayrolls(response.data.data);
                    setTotal(response.data.total || 0);
                } else {
                    setPayrolls([response.data]);
                    setTotal(1);
                }
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        }
    };

    const initData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchUsers(),
                fetchSalaries(),
                fetchPayrolls(page)
            ]);
        } catch (error) {
            console.error('Initial data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initData();
    }, [userDetails]);

    useEffect(() => {
        fetchPayrolls(page);
    }, [page]);

    const handleOpenModal = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        setIsModalOpen(false);
        fetchPayrolls();
    };

    const filteredUsers = users.filter(user => {
        if (!userSearchTerm) return true;
        const search = userSearchTerm.toLowerCase();
        return `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    });

    const filteredPayrolls = payrolls.filter(p => {
        if (!p.createdAt) return true;
        const pDate = new Date(p.createdAt);
        const pYear = pDate.getFullYear().toString();
        const pMonth = (pDate.getMonth() + 1).toString();

        if (filterYear && pYear !== filterYear) return false;
        if (filterYear && filterMonth && pMonth !== filterMonth) return false;
        return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getUserName = (userId: string) => {
        const u = users.find(x => x._id === userId);
        return u ? `${u.firstName} ${u.lastName}` : 'Unknown User';
    };

    const calculateTotals = (payroll: PayrollItem) => {
        const totalBonus = (payroll.bonus || []).reduce((acc, curr) => acc + curr.amount, 0);
        const totalDeduction = (payroll.deduction || []).reduce((acc, curr) => acc + curr.amount, 0);
        let baseSalary = 0;
        if (payroll.salary && typeof payroll.salary === 'object') {
            baseSalary = (payroll.salary.base || 0) + (payroll.salary.hra || 0) + (payroll.salary.lta || 0);
        }
        const netSalary = baseSalary + totalBonus - totalDeduction;
        return { totalBonus, totalDeduction, baseSalary, netSalary };
    };

    return {
        isHR,
        users,
        salaries,
        payrolls,
        loading,
        userSearchTerm,
        setUserSearchTerm,
        filterYear,
        setFilterYear,
        filterMonth,
        setFilterMonth,
        isModalOpen,
        setIsModalOpen,
        selectedUser,
        page,
        setPage,
        total,
        limit,
        handleOpenModal,
        handleModalSuccess,
        filteredUsers,
        filteredPayrolls,
        getUserName,
        calculateTotals
    };
}
