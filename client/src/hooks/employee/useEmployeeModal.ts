import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee, Department, Skill } from "@/types";
import { CreateEmployeeSchema, UpdateEmployeeSchema, formatZodErrors } from "@/validations/schemas";
import { useImageUpload } from "./useImageUpload";

export interface EmployeePrefillData {
    firstName: string;
    lastName: string;
    email: string;
    deptId?: string;
}

interface UseEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Employee | null;
    prefillData?: EmployeePrefillData | null;
    onSuccess: () => void;
}

export function useEmployeeModal({ isOpen, onClose, initialData, prefillData, onSuccess }: UseEmployeeModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        deptId: "",
        note: "",
    });
    const [selectedSkills, setSelectedSkills] = useState<Array<{ skillId: string; amount: number }>>([]);

    // Image upload
    const {
        previewUrl,
        photoUrl,
        uploading,
        uploadError,
        handleFileSelect,
        reset: resetImage,
    } = useImageUpload({ initialUrl: initialData?.profilePhoto });

    // Data for selects
    const [departments, setDepartments] = useState<Department[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
            // edit mode — handled below
            const deptId = typeof initialData.deptId === 'object' ? initialData.deptId?._id : initialData.deptId;

            let initialSkills: Array<{ skillId: string; amount: number }> = [];
            if (initialData.skills && Array.isArray(initialData.skills)) {
                initialSkills = initialData.skills
                    .map((skillItem: any) => {
                        if (typeof skillItem === "string") {
                            return { skillId: skillItem, amount: 1 };
                        }

                        if (!skillItem || typeof skillItem !== "object") {
                            return null;
                        }

                        const resolvedSkillId =
                            typeof skillItem.skillId === "string"
                                ? skillItem.skillId
                                : typeof skillItem.skillId === "object"
                                    ? skillItem.skillId?._id
                                    : skillItem._id;

                        if (!resolvedSkillId) {
                            return null;
                        }

                        return {
                            skillId: resolvedSkillId,
                            amount: typeof skillItem.amount === "number" && skillItem.amount > 0 ? skillItem.amount : 1,
                        };
                    })
                    .filter((skill): skill is { skillId: string; amount: number } => Boolean(skill));
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
            resetImage(initialData.profilePhoto);
        } else if (prefillData) {
            setFormData({
                firstName: prefillData.firstName,
                lastName: prefillData.lastName,
                email: prefillData.email,
                password: "",
                deptId: prefillData.deptId || "",
                note: "",
            });
            setSelectedSkills([]);
            resetImage();
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
            resetImage();
        }
        setError(null);
    }, [initialData, prefillData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeptChange = (value: string) => {
        setFormData(prev => ({ ...prev, deptId: value }));
    };

    const toggleSkill = (skillId: string) => {
        setSelectedSkills(prev =>
            prev.some(skill => skill.skillId === skillId)
                ? prev.filter(skill => skill.skillId !== skillId)
                : [...prev, { skillId, amount: 1 }]
        );
    };

    const updateSkillAmount = (skillId: string, amount: number) => {
        setSelectedSkills(prev =>
            prev.map(skill =>
                skill.skillId === skillId
                    ? { ...skill, amount: Number.isFinite(amount) && amount > 0 ? amount : 1 }
                    : skill
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload = {
                ...formData,
                skills: selectedSkills,
                profilePhoto: photoUrl || "",
            };

            // Validate with Zod
            if (initialData) {
                const { password, ...updatePayload } = payload;
                const validation = UpdateEmployeeSchema.safeParse(updatePayload);
                if (!validation.success) {
                    setFieldErrors(formatZodErrors(validation.error));
                    setError(validation.error.issues[0]?.message || "Validation failed");
                    setLoading(false);
                    return;
                }

                // Update
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
                const validation = CreateEmployeeSchema.safeParse(payload);
                if (!validation.success) {
                    setFieldErrors(formatZodErrors(validation.error));
                    setError(validation.error.issues[0]?.message || "Validation failed");
                    setLoading(false);
                    return;
                }

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
        fieldErrors,
        skillsOpen,
        setSkillsOpen,
        handleChange,
        handleDeptChange,
        toggleSkill,
        updateSkillAmount,
        handleSubmit,
        previewUrl,
        uploading,
        uploadError,
        handleFileSelect,
    };
}
