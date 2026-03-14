import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Role } from "@/types";

export interface UseRolesProps {
    _id: string;
    name: string;
    permissions?: string[];
    department?: { _id: string; name: string };
    users?: any[];
}

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("");

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchRoles = async (currentPage = 1, query: string = "", deptFilter: string = "") => {
        setLoading(true);
        try {
            let apiRoles: Role[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                if (query.trim() || deptFilter) {
                    const queryParams: Record<string, string> = {};
                    if (query.trim()) queryParams.query = query.trim();
                    if (deptFilter) queryParams.departmentId = deptFilter;

                    const result = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "search", "roles"],
                        queryParams
                    });

                    if (result.ok) {
                        const responseData = result.response.data;
                        if (Array.isArray(responseData)) {
                            apiRoles = responseData;
                        } else if (responseData && responseData.data) {
                            apiRoles = responseData.data;
                        }
                        apiTotal = apiRoles.length;
                    } else {
                        console.error("Failed to search roles:", result.response.message);
                    }
                } else {
                    const result = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "permissions"],
                        queryParams: { page: currentPage.toString(), limit: limit.toString() }
                    });

                    if (result.ok) {
                        if (Array.isArray(result.response.data)) {
                            apiRoles = result.response.data;
                        } else if (result.response.data?.data) {
                            apiRoles = result.response.data.data;
                            apiTotal = result.response.data.total || 0;
                        }
                    } else {
                        console.error("Failed to fetch roles:", result.response.message);
                    }
                }
            }

            setRoles(apiRoles);
            setTotal(apiTotal);
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchRoles(1, searchQuery, selectedDepartmentFilter);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedDepartmentFilter]);

    useEffect(() => {
        fetchRoles(page, searchQuery, selectedDepartmentFilter);
    }, [page]);

    const handleAddRole = () => {
        setSelectedRole(null);
        setIsModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm("Are you sure you want to delete this role?")) return;

        try {
            const result = await ApiCaller({
                requestType: "DELETE",
                paths: ["api", "v1", "permissions", id],
            });
            if (result.ok) {
                fetchRoles(page, searchQuery, selectedDepartmentFilter);
            } else {
                alert("Failed to delete: " + result.response.message);
            }
        } catch (error) {
            alert("Error deleting role");
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedRole(null);
    };

    const handleSuccess = () => {
        if (!selectedRole) {
            if (page !== 1) {
                setPage(1);
            } else {
                fetchRoles(1, searchQuery, selectedDepartmentFilter);
            }
        } else {
            fetchRoles(page, searchQuery, selectedDepartmentFilter);
        }
    };

    return {
        roles,
        isModalOpen,
        selectedRole,
        loading,
        page,
        setPage,
        total,
        limit,
        searchQuery,
        setSearchQuery,
        selectedDepartmentFilter,
        setSelectedDepartmentFilter,
        handleAddRole,
        handleEditRole,
        handleDeleteRole,
        handleModalClose,
        handleSuccess
    };
}
