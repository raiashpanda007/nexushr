import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { CreateDepartmentSchema, UpdateDepartmentSchema, formatZodErrors } from "@/validations/schemas";

interface Department {
    _id: string;
    name: string;
    description: string;
}

interface UseDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Department | null;
    onSuccess: () => void;
}

export function useDepartmentModal({ isOpen, onClose, initialData, onSuccess }: UseDepartmentModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description,
            });
        } else {
            setFormData({
                name: "",
                description: "",
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            // Validate with Zod
            const schema = initialData ? UpdateDepartmentSchema : CreateDepartmentSchema;
            const validation = schema.safeParse(formData);
            if (!validation.success) {
                setFieldErrors(formatZodErrors(validation.error));
                setError(validation.error.issues[0]?.message || "Validation failed");
                setLoading(false);
                return;
            }

            if (initialData) {
                // Update
                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "departments", initialData._id],
                    body: formData,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update department");
                }
            } else {
                // Create
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "departments"],
                    body: formData,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create department");
                }
            }
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        error,
        fieldErrors,
        handleChange,
        handleSubmit
    };
}
