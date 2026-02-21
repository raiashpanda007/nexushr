import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveType } from "@/components/leaves/LeaveTypeTable";

interface LeaveTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: LeaveType | null;
    onSuccess: () => void;
}

export function useLeaveTypeModal({ isOpen, onClose, initialData, onSuccess }: LeaveTypeModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        length: "FULL",
        isPaid: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                code: initialData.code || "",
                length: initialData.length || "FULL",
                isPaid: initialData.isPaid ?? true,
            });
        } else {
            setFormData({
                name: "",
                code: "",
                length: "FULL",
                isPaid: true,
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, length: value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, isPaid: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            name: formData.name,
            code: formData.code,
            length: formData.length,
            isPaid: formData.isPaid,
        };

        try {
            if (initialData) {
                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "leaves", "types", initialData._id],
                    body: payload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update leave type");
                }
            } else {
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "leaves", "types"],
                    body: payload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create leave type");
                }
            }
        } catch {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        error,
        handleChange,
        handleSelectChange,
        handleCheckboxChange,
        handleSubmit
    };
}
