import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee, Department, Skill } from "@/types";

interface UseEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Employee | null;
    onSuccess: () => void;
}

export function useEmployeeModal({ isOpen, onClose, initialData, onSuccess }: UseEmployeeModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        deptId: "",
        note: "",
    });
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    // Data for selects
    const [departments, setDepartments] = useState<Department[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [skillsOpen, setSkillsOpen] = useState(false);

    // Fetch Departments and Skills
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptRes, skillRes] = await Promise.all([
                    ApiCaller<null, any>({ requestType: "GET", paths: ["api", "v1", "departments"], queryParams: { limit: "100" } }),
                    ApiCaller<null, any>({ requestType: "GET", paths: ["api", "v1", "skills"], queryParams: { limit: "100" } })
                ]);

                if (deptRes.ok) {
                    const dData = deptRes.response.data;
                    setDepartments(Array.isArray(dData) ? dData : dData?.data || []);
                }
                if (skillRes.ok) {
                    const sData = skillRes.response.data;
                    setSkills(Array.isArray(sData) ? sData : sData?.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch form data", err);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            const deptId = typeof initialData.deptId === 'object' ? initialData.deptId?._id : initialData.deptId;

            let initialSkills: string[] = [];
            if (initialData.skills && Array.isArray(initialData.skills)) {
                initialSkills = initialData.skills.map(s => typeof s === 'object' ? s._id : s);
            }

            setFormData({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                email: initialData.email,
                password: "",
                deptId: deptId || "",
                note: initialData.note || "",
            });
            setSelectedSkills(initialSkills);
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                deptId: "",
                note: "",
            });
            setSelectedSkills([]);
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeptChange = (value: string) => {
        setFormData(prev => ({ ...prev, deptId: value }));
    };

    const toggleSkill = (skillId: string) => {
        setSelectedSkills(prev =>
            prev.includes(skillId)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                skills: selectedSkills,
            };

            if (initialData) {
                // Update
                const { password, ...updatePayload } = payload;
                const userId = initialData._id || initialData.id || "";

                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "user", "update-employee", userId],
                    body: updatePayload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update employee");
                }
            } else {
                // Create
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "user", "create-employee"],
                    body: payload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create employee");
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
        selectedSkills,
        departments,
        skills,
        loading,
        error,
        skillsOpen,
        setSkillsOpen,
        handleChange,
        handleDeptChange,
        toggleSkill,
        handleSubmit
    };
}
