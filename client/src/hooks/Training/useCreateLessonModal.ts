import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { CreateLessonFormData } from "@/types/training";
import { toast } from "sonner";

interface UseCreateLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const defaultForm: CreateLessonFormData = {
    name: "",
    description: "",
};

export function useCreateLessonModal({ isOpen, onClose, onSuccess }: UseCreateLessonModalProps) {
    const [formData, setFormData] = useState<CreateLessonFormData>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFormData(defaultForm);
            setError("");
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim() || formData.name.length < 2) {
            setError("Course name must be at least 2 characters.");
            return;
        }
        if (!formData.description.trim() || formData.description.length < 2) {
            setError("Description must be at least 2 characters.");
            return;
        }

        setLoading(true);
        try {
            const result = await ApiCaller<{ name: string; description: string; chapters: [] }, any>({
                requestType: "POST",
                paths: ["api", "v1", "training", "lessons"],
                body: { name: formData.name.trim(), description: formData.description.trim(), chapters: [] },
            });

            if (result.ok) {
                toast.success("Course created successfully");
                onSuccess();
            } else {
                setError(result.response.message || "Failed to create course");
            }
        } catch {
            setError("An error occurred while creating the course");
        } finally {
            setLoading(false);
        }
    };

    return { formData, loading, error, handleChange, handleSubmit, onClose };
}
