import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { CreateEventSchema, formatZodErrors } from "@/validations/schemas";
import type { Department, Employee } from "@/types";

interface UseCreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    name: string;
    description: string;
    date: string;
    time: string;
    type: string;
    forAll: boolean;
    employees: string[];
    departments: string[];
}

export function useCreateEventModal({ isOpen, onClose, onSuccess }: UseCreateEventModalProps) {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        date: "",
        time: "",
        type: "",
        forAll: false,
        employees: [],
        departments: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Department list for selection
    const [departmentList, setDepartmentList] = useState<Department[]>([]);
    const [deptLoading, setDeptLoading] = useState(false);

    // Employee search for selection
    const [empSearchQuery, setEmpSearchQuery] = useState("");
    const [empSearchResults, setEmpSearchResults] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
    const [empSearchLoading, setEmpSearchLoading] = useState(false);
    const [isEmpSearchOpen, setIsEmpSearchOpen] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                description: "",
                date: "",
                time: "",
                type: "",
                forAll: false,
                employees: [],
                departments: [],
            });
            setError(null);
            setFieldErrors({});
            setSelectedEmployees([]);
            setEmpSearchQuery("");
            setEmpSearchResults([]);
            fetchDepartments();
        }
    }, [isOpen]);

    // Fetch departments for checkbox selection
    const fetchDepartments = async () => {
        setDeptLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "departments"],
                queryParams: { page: "1", limit: "100" },
            });

            if (result.ok) {
                const data = result.response.data;
                if (Array.isArray(data)) {
                    setDepartmentList(data);
                } else if (data?.data) {
                    setDepartmentList(data.data);
                }
            }
        } catch {
            console.error("Failed to fetch departments");
        } finally {
            setDeptLoading(false);
        }
    };

    // Search employees with debounce
    useEffect(() => {
        if (!empSearchQuery.trim()) {
            setEmpSearchResults([]);
            return;
        }
        const timeoutId = setTimeout(async () => {
            setEmpSearchLoading(true);
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "users"],
                    queryParams: { query: empSearchQuery.trim() },
                });

                if (result.ok) {
                    const data = result.response.data;
                    const results = Array.isArray(data) ? data : data?.data || [];
                    // Filter out already selected employees
                    setEmpSearchResults(
                        results.filter(
                            (emp: Employee) => !formData.employees.includes(emp._id)
                        )
                    );
                }
            } catch {
                setEmpSearchResults([]);
            } finally {
                setEmpSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [empSearchQuery]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (value: string) => {
        setFormData((prev) => ({ ...prev, type: value }));
    };

    const handleForAllChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            forAll: checked,
            ...(checked ? { employees: [], departments: [] } : {}),
        }));
        if (checked) {
            setSelectedEmployees([]);
        }
    };

    const handleDepartmentToggle = (deptId: string) => {
        setFormData((prev) => ({
            ...prev,
            departments: prev.departments.includes(deptId)
                ? prev.departments.filter((id) => id !== deptId)
                : [...prev.departments, deptId],
        }));
    };

    const handleAddEmployee = (employee: Employee) => {
        setSelectedEmployees((prev) => [...prev, employee]);
        setFormData((prev) => ({
            ...prev,
            employees: [...prev.employees, employee._id],
        }));
        setEmpSearchQuery("");
        setEmpSearchResults([]);
        setIsEmpSearchOpen(false);
    };

    const handleRemoveEmployee = (empId: string) => {
        setSelectedEmployees((prev) => prev.filter((e) => e._id !== empId));
        setFormData((prev) => ({
            ...prev,
            employees: prev.employees.filter((id) => id !== empId),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const validation = CreateEventSchema.safeParse(formData);
            if (!validation.success) {
                setFieldErrors(formatZodErrors(validation.error));
                setError(validation.error.issues[0]?.message || "Validation failed");
                setLoading(false);
                return;
            }

            const result = await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "events"],
                body: formData,
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.response.message || "Failed to create event");
            }
        } catch {
            setError("An error occurred while creating the event");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        error,
        fieldErrors,
        departmentList,
        deptLoading,
        empSearchQuery,
        empSearchResults,
        selectedEmployees,
        empSearchLoading,
        isEmpSearchOpen,
        setEmpSearchQuery,
        setIsEmpSearchOpen,
        handleChange,
        handleTypeChange,
        handleForAllChange,
        handleDepartmentToggle,
        handleAddEmployee,
        handleRemoveEmployee,
        handleSubmit,
    };
}
