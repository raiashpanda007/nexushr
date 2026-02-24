import { useEffect, useState } from 'react';
import { CreateSalarySchema, UpdateSalarySchema, formatZodErrors } from '@/validations/schemas';

interface SalaryFormData {
    userId: string;
    baseSalary: number;
    hra: number;
    lta: number;
}

interface UseSalaryModalProps {
    isOpen: boolean;
    salaryData?: SalaryFormData | null;
    onSubmit: (data: SalaryFormData) => Promise<void>;
    isEditMode?: boolean;
}

export function useSalaryModal({ isOpen, salaryData, onSubmit, isEditMode }: UseSalaryModalProps) {
    const [formData, setFormData] = useState<SalaryFormData>({
        userId: '',
        baseSalary: 0,
        hra: 0,
        lta: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (salaryData) {
                setFormData(salaryData);
            } else {
                setFormData({
                    userId: '',
                    baseSalary: 0,
                    hra: 0,
                    lta: 0,
                });
            }
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, salaryData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: Number(value),
        }));
    };

    const handleUserChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            userId: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        // Validate with Zod
        const schema = isEditMode ? UpdateSalarySchema : CreateSalarySchema;
        const validation = schema.safeParse(formData);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        onSubmit(formData);
    };

    return {
        formData,
        error,
        fieldErrors,
        handleInputChange,
        handleUserChange,
        handleSubmit
    };
}
