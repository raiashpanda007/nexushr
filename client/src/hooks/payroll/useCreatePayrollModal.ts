import { useEffect, useState } from 'react';
import ApiCaller from '@/utils/ApiCaller';
import { CreatePayrollSchema, formatZodErrors } from '@/validations/schemas';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Salary {
    _id: string;
    userId: User | string;
    base: number;
    hra: number;
    lta: number;
}

interface BonusDeductionItem {
    reason: string;
    amount: number;
}

interface CreatePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    salaries: Salary[];
    onSuccess: () => void;
}

export function useCreatePayrollModal({ isOpen, user, salaries, onSuccess }: CreatePayrollModalProps) {
    const [selectedSalary, setSelectedSalary] = useState<string>('');
    const [month, setMonth] = useState<string>((new Date().getMonth() === 0 ? 12 : new Date().getMonth()).toString()); // default to previous month
    const [year, setYear] = useState<string>((new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()).toString());

    const [bonuses, setBonuses] = useState<BonusDeductionItem[]>([]);
    const [deductions, setDeductions] = useState<BonusDeductionItem[]>([]);

    const [newBonus, setNewBonus] = useState<BonusDeductionItem>({ reason: '', amount: 0 });
    const [newDeduction, setNewDeduction] = useState<BonusDeductionItem>({ reason: '', amount: 0 });

    const [loadingDeductions, setLoadingDeductions] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const userSalaries = user ? salaries.filter(s => {
        if (typeof s.userId === 'string') return s.userId === user._id;
        return s.userId && s.userId._id === user._id;
    }) : [];

    const activeSalaryObj = userSalaries.find(s => s._id === selectedSalary);

    useEffect(() => {
        if (isOpen) {
            setSelectedSalary('');
            setBonuses([]);
            setDeductions([]);
            setMonth((new Date().getMonth() === 0 ? 12 : new Date().getMonth()).toString());
            setYear((new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()).toString());
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchLeaveDeductions = async () => {
            if (!user?._id || !month || !year || !selectedSalary) return;
            setLoadingDeductions(true);
            try {
                const { response } = await ApiCaller<any, any>({
                    requestType: 'GET',
                    paths: ['api', 'v1', 'payroll', 'deduction', user._id],
                    queryParams: { month, year, salary: selectedSalary }
                });

                if (response?.data?.deductionsOnLeave) {
                    setDeductions(prev => {
                        const customDeductions = prev.filter(p => !response.data.deductionsOnLeave.some((l: any) => l.reason === p.reason));
                        return [...customDeductions, ...response.data.deductionsOnLeave];
                    });
                }
            } catch (err) {
                console.error("Failed to fetch leave deductions", err);
            } finally {
                setLoadingDeductions(false);
            }
        };

        fetchLeaveDeductions();
    }, [user?._id, month, year, selectedSalary]);

    const handleAddBonus = () => {
        if (newBonus.reason && newBonus.amount > 0) {
            setBonuses([...bonuses, { ...newBonus }]);
            setNewBonus({ reason: '', amount: 0 });
        }
    };

    const handleAddDeduction = () => {
        if (newDeduction.reason && newDeduction.amount > 0) {
            setDeductions([...deductions, { ...newDeduction }]);
            setNewDeduction({ reason: '', amount: 0 });
        }
    };

    const removeBonus = (index: number) => {
        setBonuses(bonuses.filter((_, i) => i !== index));
    };

    const removeDeduction = (index: number) => {
        setDeductions(deductions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setError(null);
        setFieldErrors({});

        const payload = {
            user: user._id,
            salary: selectedSalary,
            month: Number(month),
            year: Number(year),
            bonus: bonuses.length > 0 ? bonuses : undefined,
            deduction: deductions.length > 0 ? deductions : undefined
        };

        // Validate with Zod
        const validation = CreatePayrollSchema.safeParse(payload);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        setSubmitting(true);
        try {
            const result = await ApiCaller({
                requestType: 'POST',
                paths: ['api', 'v1', 'payroll'],
                body: payload
            });

            if (result.ok) {
                onSuccess();
            } else {
                setError(result.response.message || "Failed to create payroll");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to create payroll");
        } finally {
            setSubmitting(false);
        }
    };

    return {
        selectedSalary, setSelectedSalary,
        month, setMonth,
        year, setYear,
        bonuses,
        deductions,
        newBonus, setNewBonus,
        newDeduction, setNewDeduction,
        loadingDeductions,
        submitting,
        error,
        fieldErrors,
        userSalaries,
        activeSalaryObj,
        handleAddBonus,
        handleAddDeduction,
        removeBonus,
        removeDeduction,
        handleSubmit
    };
}
