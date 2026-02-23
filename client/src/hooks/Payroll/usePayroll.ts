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
    user: any;
    salary: any;
    bonus: { reason: string; amount: number }[];
    deduction: { reason: string; amount: number }[];
    createdAt: string;
    syncState?: "unsynced" | "synced";
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

    const [usersPage, setUsersPage] = useState(1);
    const [usersTotal, setUsersTotal] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    const usersLimit = 10;

    const fetchUsers = async (currentPage = 1) => {
        if (!isHR) return;
        try {
            const { response } = await ApiCaller<any, User[]>({
                requestType: 'GET',
                paths: ['api', 'v1', 'user', 'get-users'],
                queryParams: { limit: usersLimit.toString(), page: currentPage.toString() }
            });
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    setUsers(response.data);
                } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
                    setUsers((response.data as any).data);
                    setUsersTotal((response.data as any).total || 0);
                }
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
            let apiPayrolls: PayrollItem[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                const { response } = await ApiCaller<any, any>({
                    requestType: 'GET',
                    paths: ['api', 'v1', 'payroll'],
                    queryParams: { page: currentPage.toString(), limit: limit.toString() }
                });
                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        apiPayrolls = response.data;
                    } else if (response.data.data) {
                        apiPayrolls = response.data.data;
                        apiTotal = response.data.total || 0;
                    } else {
                        apiPayrolls = [response.data];
                        apiTotal = 1;
                    }
                }
            }

            setPayrolls(apiPayrolls);
            setTotal(apiTotal);
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

    useEffect(() => {
        fetchUsers(usersPage);
    }, [usersPage]);

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

    const getUserName = (userId: any) => {
        if (!userId) return 'Unknown User';
        if (typeof userId === 'object' && userId.firstName) {
            return `${userId.firstName} ${userId.lastName}`;
        }
        const u = users.find(x => x._id === userId);
        return u ? `${u.firstName} ${u.lastName}` : 'Unknown User';
    };

    const calculateTotals = (payroll: PayrollItem) => {
        const totalBonus = (payroll.bonus || []).reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
        const totalDeduction = (payroll.deduction || []).reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
        let baseSalary = 0;
        if (payroll.salary && typeof payroll.salary === 'object') {
            baseSalary = Number(payroll.salary.base || 0) + Number(payroll.salary.hra || 0) + Number(payroll.salary.lta || 0);
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
        usersPage,
        setUsersPage,
        usersTotal,
        usersLimit,
        handleOpenModal,
        handleModalSuccess,
        filteredUsers,
        filteredPayrolls,
        getUserName,
        calculateTotals
    };
}
