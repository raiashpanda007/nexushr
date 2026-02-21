import { useEffect, useState } from 'react';

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
}

export function useSalaryModal({ isOpen, salaryData, onSubmit }: UseSalaryModalProps) {
    const [formData, setFormData] = useState<SalaryFormData>({
        userId: '',
        baseSalary: 0,
        hra: 0,
        lta: 0,
    });

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
        onSubmit(formData);
    };

    return {
        formData,
        handleInputChange,
        handleUserChange,
        handleSubmit
    };
}
