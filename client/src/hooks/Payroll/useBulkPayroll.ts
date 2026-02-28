import { useState, useCallback, useEffect } from 'react';
import ApiCaller from '@/utils/ApiCaller';
import type { Department } from '@/types';

interface BonusDeductionItem {
    reason: string;
    amount: number;
}

export const useBulkPayroll = (onSuccess: () => void) => {
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [departmentList, setDepartmentList] = useState<Department[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

    const [bulkBonus, setBulkBonus] = useState<BonusDeductionItem[]>([]);
    const [bulkDeduction, setBulkDeduction] = useState<BonusDeductionItem[]>([]);

    const fetchDepartments = useCallback(async () => {
        try {
            const result = await ApiCaller<null, any>({
                requestType: 'GET',
                paths: ['api', 'v1', 'departments'],
                queryParams: { page: '1', limit: '100' },
            });
            if (result.ok) {
                const data = result.response.data;
                if (Array.isArray(data)) {
                    setDepartmentList(data);
                } else if (Array.isArray(data?.data)) {
                    setDepartmentList(data.data);
                }
            }
        } catch {
            setDepartmentList([]);
        }
    }, []);

    useEffect(() => {
        if (isBulkDialogOpen) {
            setBulkError(null);
            fetchDepartments();
        }
    }, [isBulkDialogOpen, fetchDepartments]);

    const handleDepartmentToggle = useCallback((deptId: string) => {
        setSelectedDepartments((prev) =>
            prev.includes(deptId)
                ? prev.filter((id) => id !== deptId)
                : [...prev, deptId]
        );
    }, []);

    const handleGenerateBulk = useCallback(async () => {
        setBulkLoading(true);
        setBulkError(null);

        const departments = selectedDepartments.length > 0 ? selectedDepartments : undefined;
        const validBonus = bulkBonus.filter(b => b.reason.trim() && b.amount > 0);
        const validDeduction = bulkDeduction.filter(d => d.reason.trim() && d.amount > 0);

        try {
            const result = await ApiCaller<{
                month: number;
                year: number;
                department?: string[];
                bulkBonus?: BonusDeductionItem[];
                bulkDeduction?: BonusDeductionItem[];
            }, any>({
                requestType: 'POST',
                paths: ['api', 'v1', 'payroll', 'bulk'],
                body: {
                    month: selectedMonth,
                    year: selectedYear,
                    department: departments,
                    bulkBonus: validBonus.length > 0 ? validBonus : undefined,
                    bulkDeduction: validDeduction.length > 0 ? validDeduction : undefined,
                },
            });

            if (!result.ok) {
                setBulkError(result.response?.message || 'Failed to generate bulk payroll.');
                return;
            }

            setIsBulkDialogOpen(false);
            setSelectedDepartments([]);
            setBulkBonus([]);
            setBulkDeduction([]);
            onSuccess();
        } catch {
            setBulkError('Failed to generate bulk payroll.');
        } finally {
            setBulkLoading(false);
        }
    }, [selectedDepartments, selectedMonth, selectedYear, bulkBonus, bulkDeduction, onSuccess]);

    const addBulkBonus = useCallback(() => {
        setBulkBonus((prev) => [...prev, { reason: '', amount: 0 }]);
    }, []);

    const removeBulkBonus = useCallback((index: number) => {
        setBulkBonus((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const updateBulkBonus = useCallback((index: number, field: 'reason' | 'amount', value: string | number) => {
        setBulkBonus((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }, []);

    const addBulkDeduction = useCallback(() => {
        setBulkDeduction((prev) => [...prev, { reason: '', amount: 0 }]);
    }, []);

    const removeBulkDeduction = useCallback((index: number) => {
        setBulkDeduction((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const updateBulkDeduction = useCallback((index: number, field: 'reason' | 'amount', value: string | number) => {
        setBulkDeduction((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }, []);

    const openDialog = useCallback(() => setIsBulkDialogOpen(true), []);

    const closeDialog = useCallback(() => {
        setIsBulkDialogOpen(false);
        setSelectedDepartments([]);
        setBulkBonus([]);
        setBulkDeduction([]);
        setBulkError(null);
    }, []);

    return {
        isBulkDialogOpen,
        setIsBulkDialogOpen,
        departmentList,
        selectedDepartments,
        bulkLoading,
        bulkError,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        handleDepartmentToggle,
        handleGenerateBulk,
        openDialog,
        closeDialog,
        bulkBonus,
        bulkDeduction,
        addBulkBonus,
        removeBulkBonus,
        updateBulkBonus,
        addBulkDeduction,
        removeBulkDeduction,
        updateBulkDeduction,
    };
};
