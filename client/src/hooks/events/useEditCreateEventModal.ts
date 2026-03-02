import type { Department, Employee } from "@/types";
import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { CreateEventSchema, formatZodErrors } from "@/validations/schemas";
import type { EventItem } from "@/types/events";

interface UseEditEventModalProps {
    eventDetails: EventItem;
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
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

const toDateInputValue = (dateStr: string): string => {
    try {
        return new Date(dateStr).toISOString().split("T")[0];
    } catch {
        return dateStr;
    }
};

export function useEditCreateEventModal({ eventDetails, open, onClose, onSuccess }: UseEditEventModalProps) {
    const buildInitialFormData = (): FormData => ({
        name: eventDetails.name,
        description: eventDetails.description,
        date: toDateInputValue(eventDetails.date),
        time: eventDetails.time,
        type: eventDetails.type,
        forAll: eventDetails.forAll,
        employees: eventDetails.employeeDetails?.map((e) => e._id) ?? eventDetails.resepectedEmplooyees ?? [],
        departments: eventDetails.departmentDetails?.map((d) => d._id) ?? eventDetails.respectedToDepartments ?? [],
    });

    const [formData, setFormData] = useState<FormData>(buildInitialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Department list for selection
    const [departmentList, setDepartmentList] = useState<Department[]>([]);
    const [deptLoading, setDeptLoading] = useState(false);

    // Employee search for selection
    const [empSearchQuery, setEmpSearchQuery] = useState("");
    const [empSearchResults, setEmpSearchResults] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>(
        eventDetails.employeeDetails ?? []
    );
    const [empSearchLoading, setEmpSearchLoading] = useState(false);
    const [isEmpSearchOpen, setIsEmpSearchOpen] = useState(false);

    // Re-initialise when modal opens or eventDetails changes
    useEffect(() => {
        if (open) {
            const initial = buildInitialFormData();
            setFormData(initial);
            setError(null);
            setFieldErrors({});
            setEmpSearchQuery("");
            setEmpSearchResults([]);
            setSelectedEmployees(eventDetails.employeeDetails ?? []);
            fetchDepartments();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, eventDetails._id]);

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
                setDepartmentList(Array.isArray(data) ? data : data?.data ?? []);
            }
        } catch {
            console.error("Failed to fetch departments");
        } finally {
            setDeptLoading(false);
        }
    };

    // Debounced employee search
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
                    const results: Employee[] = Array.isArray(data) ? data : data?.data ?? [];
                    setEmpSearchResults(
                        results.filter((emp) => !formData.employees.includes(emp._id))
                    );
                }
            } catch {
                setEmpSearchResults([]);
            } finally {
                setEmpSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (checked) setSelectedEmployees([]);
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
        setFormData((prev) => ({ ...prev, employees: [...prev.employees, employee._id] }));
        setEmpSearchQuery("");
        setEmpSearchResults([]);
        setIsEmpSearchOpen(false);
    };

    const handleRemoveEmployee = (empId: string) => {
        setSelectedEmployees((prev) => prev.filter((e) => e._id !== empId));
        setFormData((prev) => ({ ...prev, employees: prev.employees.filter((id) => id !== empId) }));
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
                requestType: "PUT",
                paths: ["api", "v1", "events", eventDetails._id],
                body: { id: eventDetails._id, ...formData },
            });

            if (result.ok) {
                onSuccess?.();
                onClose();
            } else {
                setError((result.response as any)?.message || "Failed to update event");
            }
        } catch {
            setError("An error occurred while updating the event");
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

