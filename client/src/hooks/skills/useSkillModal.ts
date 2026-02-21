import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";

interface Skill {
    _id: string;
    name: string;
    category: string;
}

interface UseSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Skill | null;
    onSuccess: () => void;
}

export function useSkillModal({ isOpen, onClose, initialData, onSuccess }: UseSkillModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                category: initialData.category,
            });
        } else {
            setFormData({
                name: "",
                category: "",
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (initialData) {
                // Update
                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "skills", initialData._id],
                    body: formData,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update skill");
                }
            } else {
                // Create
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "skills"],
                    body: formData,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create skill");
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
        handleChange,
        handleSubmit
    };
}
