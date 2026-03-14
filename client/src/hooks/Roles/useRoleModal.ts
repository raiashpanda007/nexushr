import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Role, Department, Employee, Permission } from "@/types";

interface UseRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Role | null;
    onSuccess: () => void;
}

export function useRoleModal({ isOpen, onClose, initialData, onSuccess }: UseRoleModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        departmentId: "",
        users: [] as string[],
        permissions: [] as Permission[]
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const modules = ["EMPLOYEES", "DEPARTMENTS", "ATTENDANCE", "LEAVE", "PAYROLL"];
    const actions = ["CREATE", "READ", "UPDATE", "DELETE"];

    // Fetch departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "departments"],
                    queryParams: { limit: "1000" }
                });

                if (result.ok) {
                    let deptList = [];
                    if (Array.isArray(result.response.data)) {
                        deptList = result.response.data;
                    } else if (result.response.data?.data) {
                        deptList = result.response.data.data;
                    }
                    setDepartments(deptList);
                }
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchDepartments();
    }, []);

    // Fetch employees on mount
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "user", "get-users"],
                    queryParams: { limit: "1000" }
                });

                if (result.ok) {
                    let empList = [];
                    if (Array.isArray(result.response.data)) {
                        empList = result.response.data;
                    } else if (result.response.data?.data) {
                        empList = result.response.data.data;
                    }
                    setEmployees(empList);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };

        fetchEmployees();
    }, []);

    // Filter employees by selected department
    useEffect(() => {
        if (formData.departmentId && employees.length > 0) {
            const filtered = employees.filter(emp => {
                const empDeptId = typeof emp.deptId === 'string' ? emp.deptId : emp.deptId?._id;
                return empDeptId === formData.departmentId;
            });
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees([]);
        }
    }, [formData.departmentId, employees]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                departmentId: typeof initialData.department === 'string'
                    ? initialData.department
                    : initialData.department?._id || "",
                users: (initialData.users || []).map(user => {
                    return typeof user === 'string' ? user : user._id;
                }),
                permissions: (initialData.permissions as Permission[]) || []
            });
        } else {
            setFormData({
                name: "",
                departmentId: "",
                users: [],
                permissions: []
            });
        }
        setError(null);
        setFieldErrors({});
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleDepartmentChange = (deptId: string) => {
        setFormData((prev) => ({ ...prev, departmentId: deptId, users: [] }));
    };

    const handleEmployeeToggle = (employeeId: string) => {
        setFormData((prev) => {
            const users = prev.users.includes(employeeId)
                ? prev.users.filter(id => id !== employeeId)
                : [...prev.users, employeeId];
            return { ...prev, users };
        });
    };

    const handleModuleActionToggle = (module: string, action: string) => {
        setFormData((prev) => {
            let permissions = [...prev.permissions];
            const moduleIndex = permissions.findIndex(p => p.module === module);

            if (moduleIndex === -1) {
                // Module doesn't exist, create it with this action
                permissions.push({ module, actions: [action] });
            } else {
                // Module exists, toggle the action
                const updatedActions = [...permissions[moduleIndex].actions];
                
                if (updatedActions.includes(action)) {
                    const newActions = updatedActions.filter(a => a !== action);
                    if (newActions.length === 0) {
                        // If no actions left, remove the module
                        permissions = permissions.filter((_, i) => i !== moduleIndex);
                    } else {
                        permissions[moduleIndex] = { ...permissions[moduleIndex], actions: newActions };
                    }
                } else {
                    permissions[moduleIndex] = { ...permissions[moduleIndex], actions: [...updatedActions, action] };
                }
            }

            return { ...prev, permissions };
        });
    };

    const isModuleActionChecked = (module: string, action: string) => {
        return formData.permissions.some(p => p.module === module && p.actions.includes(action));
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = "Role name is required";
        }
        if (!formData.departmentId) {
            errors.departmentId = "Department is required";
        }
        if (formData.users.length === 0) {
            errors.users = "At least one employee must be selected";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                name: formData.name,
                departmentId: formData.departmentId,
                users: formData.users,
                permissions: formData.permissions
            };

            let result;
            if (initialData) {
                result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "permissions", initialData._id],
                    body: payload
                });
            } else {
                result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "permissions"],
                    body: payload
                });
            }

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.response.message || "Failed to save role");
            }
        } catch (err) {
            setError("An error occurred while saving the role");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        departments,
        employees: filteredEmployees,
        modules,
        actions,
        loading,
        error,
        fieldErrors,
        handleChange,
        handleDepartmentChange,
        handleEmployeeToggle,
        handleModuleActionToggle,
        isModuleActionChecked,
        handleSubmit
    };
}
