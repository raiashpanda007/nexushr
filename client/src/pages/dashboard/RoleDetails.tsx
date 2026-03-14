import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleDetail } from "@/hooks/Roles/useRoleDetail";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee } from "@/types";
import {
    Shield,
    ChevronLeft,
    Users,
    Lock,
    Save,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Plus,
    X,
} from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function RoleDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const roleId = id || "";

    const {
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
        handleSaveChanges,
        handleDeleteRole
    } = useRoleDetail(roleId);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Employee[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [initialRoleEmployeeIds, setInitialRoleEmployeeIds] = useState<string[]>([]);
    const [searchSelectedEmployees, setSearchSelectedEmployees] = useState<Employee[]>([]);

    const deptId = typeof department === 'string' ? department : department?._id;

    // Capture initial role employees once role data is available.
    // This is used to separate existing employees vs newly added from search.
    useEffect(() => {
        if (!role) return;
        const initialIds = (role.users || []).map((user) =>
            typeof user === "string" ? user : user._id
        );
        setInitialRoleEmployeeIds(initialIds);
        setSearchSelectedEmployees([]);
    }, [role]);

    // Keep searched-selected list in sync if user removes employees via other controls.
    useEffect(() => {
        setSearchSelectedEmployees((prev) =>
            prev.filter((emp) => selectedEmployees.includes(emp._id))
        );
    }, [selectedEmployees]);

    // Existing employees (were part of role initially and still selected)
    // Get employees directly from role, not from department
    const existingRoleEmployees = allEmployeesInDept.filter((emp) =>
        selectedEmployees.includes(emp._id)
    ).concat(
        // Include employees from role.users that might not be in allEmployeesInDept (from other departments)
        (role?.users || []).filter((user) => {
            const userId = typeof user === "string" ? user : user._id;
            return selectedEmployees.includes(userId) && 
                   !allEmployeesInDept.some(emp => emp._id === userId);
        }).map((user) => {
            if (typeof user === "string") {
                return { _id: user, firstName: "Unknown", lastName: "", email: "" } as Employee;
            }
            return user as Employee;
        })
    );

    // Newly added employees from search during this edit session.
    const newlyAddedEmployees = searchSelectedEmployees.filter((emp) =>
        !initialRoleEmployeeIds.includes(emp._id) && selectedEmployees.includes(emp._id)
    );

    // Get available employees (not in the role yet)
    const availableEmployees = allEmployeesInDept.filter(emp => 
        !selectedEmployees.includes(emp._id)
    );

    // Search employees via API with debounce
    useEffect(() => {
        const searchEmployees = async () => {
            if (!employeeSearchQuery.trim() || !deptId) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "employees"],
                    queryParams: {
                        query: employeeSearchQuery,
                        departmentId: deptId,
                        limit: "20"
                    }
                });

                if (result.ok) {
                    let empList: Employee[] = [];
                    if (Array.isArray(result.response.data)) {
                        empList = result.response.data;
                    } else if (result.response.data?.data) {
                        empList = result.response.data.data;
                    }
                    
                    // Filter out already selected employees
                    const filtered = empList.filter((emp: Employee) => !selectedEmployees.includes(emp._id));
                    setSearchResults(filtered);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error("Search error:", err);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchEmployees, 300);
        return () => clearTimeout(debounceTimer);
    }, [employeeSearchQuery, deptId, selectedEmployees]);

    const handleDelete = async () => {
        const success = await handleDeleteRole();
        if (success) {
            navigate("/roles");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-base font-medium animate-pulse">Loading role details...</p>
            </div>
        );
    }

    if (!role) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                <Shield className="h-12 w-12 opacity-30 mb-4" />
                <p className="text-lg font-medium">Role not found</p>
                <Button variant="outline" onClick={() => navigate("/roles")} className="mt-4">
                    Back to Roles
                </Button>
            </div>
        );
    }

    const deptName = typeof department === 'object' ? department?.name : department;

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Back Button & Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/roles")}
                    className="h-9 gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{role.name}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{deptName} Department</p>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <p className="text-destructive text-sm font-medium">{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50/50 border border-green-200/60">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-green-600 text-sm font-medium">{successMessage}</p>
                </div>
            )}

            {/* Main Content */}
            <Tabs defaultValue="employees" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto bg-muted/30 border border-border/40 rounded-xl p-1">
                    <TabsTrigger value="employees" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Employees</span>
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Permissions</span>
                    </TabsTrigger>
                </TabsList>

                {/* Employees Tab */}
                <TabsContent value="employees" className="space-y-4 mt-6">
                    {/* Existing Role Employees */}
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle className="text-lg">Employees in this Role</CardTitle>
                                <CardDescription>
                                    {existingRoleEmployees.length} employee{existingRoleEmployees.length !== 1 ? "s" : ""} assigned to this role
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {existingRoleEmployees.length > 0 ? (
                                <ScrollArea className="h-72 border rounded-lg border-border/60 p-4 bg-background/50">
                                    <div className="space-y-3">
                                        {existingRoleEmployees.map((emp) => (
                                            <div
                                                key={emp._id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/40"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-foreground">
                                                        {emp.firstName} {emp.lastName}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {emp.email}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEmployeeToggle(emp._id)}
                                                    disabled={saving}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="p-8 rounded-lg bg-muted/30 border border-border/40 text-center">
                                    <Users className="h-10 w-10 opacity-30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm font-medium">
                                        No employees assigned to this role yet
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add Employees */}
                    {availableEmployees.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Add Employees
                                </CardTitle>
                                <CardDescription>
                                    Search and add employees from {deptName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Popover open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-muted-foreground"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Search and add employee...
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search by name or email..."
                                                value={employeeSearchQuery}
                                                onValueChange={setEmployeeSearchQuery}
                                            />
                                            {searchLoading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <>
                                                    {employeeSearchQuery.trim() && searchResults.length === 0 && (
                                                        <CommandEmpty>No employees found.</CommandEmpty>
                                                    )}
                                                    {!employeeSearchQuery.trim() && (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                                            Type to search employees...
                                                        </div>
                                                    )}
                                                    <CommandGroup>
                                                        <ScrollArea className="h-64">
                                                            {searchResults.map((emp) => (
                                                                <CommandItem
                                                                    key={emp._id}
                                                                    value={emp._id}
                                                                    onSelect={() => {
                                                                        handleEmployeeToggle(emp._id);
                                                                        setSearchSelectedEmployees((prev) =>
                                                                            prev.some((e) => e._id === emp._id)
                                                                                ? prev
                                                                                : [...prev, emp]
                                                                        );
                                                                        setEmployeeSearchQuery("");
                                                                        setAddEmployeeOpen(false);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium">
                                                                            {emp.firstName} {emp.lastName}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {emp.email}
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </ScrollArea>
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {/* Newly added employees from search */}
                                {newlyAddedEmployees.length > 0 && (
                                    <div className="mt-4 border rounded-lg border-border/60 p-3 bg-background/50">
                                        <p className="text-sm font-medium mb-2">
                                            Newly Added from Search ({newlyAddedEmployees.length})
                                        </p>
                                        <div className="space-y-2">
                                            {newlyAddedEmployees.map((emp) => (
                                                <div
                                                    key={emp._id}
                                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">
                                                            {emp.firstName} {emp.lastName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {emp.email}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            handleEmployeeToggle(emp._id);
                                                            setSearchSelectedEmployees((prev) =>
                                                                prev.filter((e) => e._id !== emp._id)
                                                            );
                                                        }}
                                                        disabled={saving}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Permissions</CardTitle>
                            <CardDescription>
                                {permissions.reduce((total, p) => total + p.actions.length, 0)} permission{permissions.reduce((total, p) => total + p.actions.length, 0) !== 1 ? "s" : ""} assigned
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96 border rounded-lg border-border/60 p-4 bg-background/50">
                                <div className="space-y-4">
                                    {modules.map((module) => (
                                        <div key={module} className="space-y-2">
                                            <h4 className="font-semibold text-sm text-gray-700">{module}</h4>
                                            <div className="grid grid-cols-2 gap-2 ml-2">
                                                {actions.map((action) => (
                                                    <div key={`${module}-${action}`} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`perm-detail-${module}-${action}`}
                                                            checked={isModuleActionChecked(module, action)}
                                                            onCheckedChange={() =>
                                                                handleModuleActionToggle(module, action)
                                                            }
                                                            disabled={saving}
                                                        />
                                                        <label
                                                            htmlFor={`perm-detail-${module}-${action}`}
                                                            className="text-sm cursor-pointer font-normal"
                                                        >
                                                            {action}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="h-11 font-semibold gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>

                <div className="flex-1" />

                {!showDeleteConfirm ? (
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving}
                        className="h-11 font-semibold gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Role
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm font-medium text-muted-foreground">Delete this role?</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={saving}
                            className="h-9 gap-1"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Yes, Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={saving}
                            className="h-9"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
