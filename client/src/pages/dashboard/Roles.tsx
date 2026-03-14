import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import RoleTable from "@/components/roles/RoleTable";
import RoleModal from "@/components/roles/RoleModal";
import { useRoles } from "@/hooks/Roles/useRoles";
import { Shield, Search, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { Department } from "@/types";

export default function Roles() {
    const {
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
    } = useRoles();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch departments for filter
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

    const handleDeleteClick = (roleId: string) => {
        setRoleToDelete(roleId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;
        
        setIsDeleting(true);
        try {
            await handleDeleteRole(roleToDelete);
            setDeleteDialogOpen(false);
            setRoleToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <Shield className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Role Management</h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">Create and manage employee roles and permissions</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleAddRole}
                        className="h-11 font-semibold gap-2 whitespace-nowrap rounded-xl px-5 self-start sm:self-auto"
                    >
                        <Plus className="h-5 w-5" />
                        Add Role
                    </Button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                            placeholder="Search roles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-10 bg-background/70 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/30 rounded-xl shadow-inner transition-colors"
                        />
                    </div>

                    {/* Department Filter */}
                    <Select 
                        value={selectedDepartmentFilter || "all"} 
                        onValueChange={(value) => setSelectedDepartmentFilter(value === "all" ? "" : value)}
                    >
                        <SelectTrigger className="h-11 w-full sm:w-56 rounded-xl bg-background/70 border-border/60">
                            <SelectValue placeholder="Filter by department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept._id} value={dept._id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-base font-medium animate-pulse">Loading roles...</p>
                    </div>
                ) : (
                    <>
                        <RoleTable roles={roles} onEdit={handleEditRole} onDelete={handleDeleteClick} />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Previous
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground px-2">
                                        {page} / {totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || totalPages === 0}
                                        className="gap-1"
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <RoleModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialData={selectedRole}
                onSuccess={handleSuccess}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Delete Role
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this role? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 flex sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setRoleToDelete(null);
                            }}
                            disabled={isDeleting}
                            className="h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="h-10 gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete Role
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
