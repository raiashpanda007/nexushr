import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Role, Employee, Department, Permission } from "@/types";

export function useRoleDetail(roleId: string) {
    const [role, setRole] = useState<Role | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const [allEmployeesInDept, setAllEmployeesInDept] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Available modules and actions
    const modules = ["EMPLOYEES", "DEPARTMENTS", "ATTENDANCE", "LEAVE", "PAYROLL"];
    const actions = ["CREATE", "READ", "UPDATE", "DELETE"];

    const fetchRoleDetail = async (withLoading = true) => {
        if (withLoading) {
            setLoading(true);
        }

        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "permissions", roleId]
            });

            if (result.ok) {
                const roleData = result.response.data as Role;
                setRole(roleData);
                setPermissions((roleData.permissions as Permission[]) || []);

                const deptId = typeof roleData.department === "string"
                    ? roleData.department
                    : roleData.department?._id;

                if (deptId) {
                    const deptResult = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "departments", deptId]
                    });

                    if (deptResult.ok) {
                        setDepartment(deptResult.response.data);
                    }

                    const empResult = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "user", "get-users"],
                        queryParams: { departmentId: deptId, limit: "1000" }
                    });

                    if (empResult.ok) {
                        let empList = [];
                        if (Array.isArray(empResult.response.data)) {
                            empList = empResult.response.data;
                        } else if (empResult.response.data?.data) {
                            empList = empResult.response.data.data;
                        }
                        setAllEmployeesInDept(empList);
                    }
                }

                const userIds = (roleData.users || []).map((user: any) =>
                    typeof user === "string" ? user : user._id
                );
                setSelectedEmployees(userIds);
            } else {
                setError(result.response.message || "Failed to fetch role");
            }
        } catch (err) {
            setError("Error loading role details");
            console.error(err);
        } finally {
            if (withLoading) {
                setLoading(false);
            }
        }
    };

    // Fetch role details on mount/id change
    useEffect(() => {
        if (roleId) {
            fetchRoleDetail(true);
        }
    }, [roleId]);

    const handleModuleActionToggle = (module: string, action: string) => {
        setPermissions(prev => {
            let updatedPermissions = [...prev];
            const moduleIndex = updatedPermissions.findIndex(p => p.module === module);

            if (moduleIndex === -1) {
                // Module doesn't exist, create it with this action
                updatedPermissions.push({ module, actions: [action] });
            } else {
                // Module exists, toggle the action
                const updatedActions = [...updatedPermissions[moduleIndex].actions];
                
                if (updatedActions.includes(action)) {
                    const newActions = updatedActions.filter(a => a !== action);
                    if (newActions.length === 0) {
                        // If no actions left, remove the module
                        updatedPermissions = updatedPermissions.filter((_, i) => i !== moduleIndex);
                    } else {
                        updatedPermissions[moduleIndex] = { ...updatedPermissions[moduleIndex], actions: newActions };
                    }
                } else {
                    updatedPermissions[moduleIndex] = { ...updatedPermissions[moduleIndex], actions: [...updatedActions, action] };
                }
            }

            return updatedPermissions;
        });
        clearMessages();
    };

    const isModuleActionChecked = (module: string, action: string) => {
        return permissions.some(p => p.module === module && p.actions.includes(action));
    };

    const handleEmployeeToggle = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
        clearMessages();
    };

    const handleAddAllEmployees = () => {
        const allIds = allEmployeesInDept.map(emp => emp._id);
        setSelectedEmployees(allIds);
        clearMessages();
    };

    const handleRemoveAllEmployees = () => {
        setSelectedEmployees([]);
        clearMessages();
    };

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    const handleSaveChanges = async () => {
        if (!role) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const payload = {
                name: role.name,
                permissions,
                users: selectedEmployees,
                departmentId: typeof role.department === 'string'
                    ? role.department
                    : role.department?._id
            };

            const result = await ApiCaller({
                requestType: "PUT",
                paths: ["api", "v1", "permissions", roleId],
                body: payload
            });

            if (result.ok) {
                setSuccessMessage("Role updated successfully");
                // Re-fetch from source-of-truth endpoint to reflect exact role users.
                await fetchRoleDetail(false);
            } else {
                setError(result.response.message || "Failed to update role");
            }
        } catch (err) {
            setError("Error saving changes");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (): Promise<boolean> => {
        if (!role || !confirm("Are you sure you want to delete this role?")) {
            return false;
        }

        setSaving(true);
        setError(null);

        try {
            const result = await ApiCaller({
                requestType: "DELETE",
                paths: ["api", "v1", "permissions", roleId]
            });

            if (result.ok) {
                return true;
            } else {
                setError(result.response.message || "Failed to delete role");
                return false;
            }
        } catch (err) {
            setError("Error deleting role");
            console.error(err);
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        role,
        department,
        allEmployeesInDept,
        selectedEmployees,
        permissions,
        modules,
        actions,
        loading,
        saving,
        error,
        successMessage,
        handleModuleActionToggle,
        isModuleActionChecked,
        handleEmployeeToggle,
        handleAddAllEmployees,
        handleRemoveAllEmployees,
        handleSaveChanges,
        handleDeleteRole,
        clearMessages
    };
}
