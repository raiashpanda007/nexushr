import { useEffect, useState } from 'react';
import { UpdateSalarySchema, formatZodErrors } from '@/validations/schemas';

interface EditSalaryFormData {
    baseSalary: number;
    hra: number;
    lta: number;
}

interface UseEditSalaryModalProps {
    isOpen: boolean;
    salaryData: EditSalaryFormData | null;
    onSubmit: (data: EditSalaryFormData) => Promise<void>;
}

export function useEditSalaryModal({ isOpen, salaryData, onSubmit }: UseEditSalaryModalProps) {
    const [formData, setFormData] = useState<EditSalaryFormData>({
        baseSalary: 0,
        hra: 0,
        lta: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && salaryData) {
            setFormData(salaryData);
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, salaryData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const validation = UpdateSalarySchema.safeParse(formData);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err?.message || 'Failed to update salary. Please check your inputs.');
        }
    };

    return {
        formData,
        error,
        fieldErrors,
        handleInputChange,
        handleSubmit,
    };
}
