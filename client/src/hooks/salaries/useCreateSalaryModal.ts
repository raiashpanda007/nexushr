import { useEffect, useState } from 'react';
import { CreateSalarySchema, formatZodErrors } from '@/validations/schemas';

interface CreateSalaryFormData {
    userId: string;
    baseSalary: number;
    hra: number;
    lta: number;
}

interface UseCreateSalaryModalProps {
    isOpen: boolean;
    onSubmit: (data: CreateSalaryFormData) => Promise<void>;
}

export function useCreateSalaryModal({ isOpen, onSubmit }: UseCreateSalaryModalProps) {
    const [formData, setFormData] = useState<CreateSalaryFormData>({
        userId: '',
        baseSalary: 0,
        hra: 0,
        lta: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData({ userId: '', baseSalary: 0, hra: 0, lta: 0 });
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    };

    const handleUserChange = (value: string) => {
        setFormData((prev) => ({ ...prev, userId: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const validation = CreateSalarySchema.safeParse(formData);
        if (!validation.success) {
            setFieldErrors(formatZodErrors(validation.error));
            setError(validation.error.issues[0]?.message || "Validation failed");
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err?.message || 'Failed to create salary. Please check your inputs.');
        }
    };

    return {
        formData,
        error,
        fieldErrors,
        handleInputChange,
        handleUserChange,
        handleSubmit,
    };
}
