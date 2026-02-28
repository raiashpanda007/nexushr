import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import AssetTable from "@/components/assets/AssetTable";
import CreateAssetModal from "@/components/assets/CreateAssetModal";
import { useAssets } from "@/hooks/Assets/useAssets";
import {
    Package,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Filter,
    CheckCircle2,
    Wrench,
    Trash2,
    ChevronsUpDown,
    Check,
    UserCircle,
    Search,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
    { value: "all", label: "All Statuses" },
    { value: "AVAILABLE", label: "Available" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "DISPOSED", label: "Disposed" },
];

export default function Assets() {
    const {
        assets,
        loading,
        page,
        setPage,
        total,
        limit,
        role,
        isCreateOpen,
        statusFilter,
        departmentFilter,
        departments,
        stats,
        employeeSearchOpen,
        setEmployeeSearchOpen,
        employeeSearchQuery,
        employeeSearchResults,
        employeeSearching,
        selectedEmployee,
        handleEmployeeSearchChange,
        handleSelectEmployee,
        handleClearEmployee,
        handleStatusFilter,
        handleDepartmentFilter,
        handleOpenCreate,
        handleCloseCreate,
        handleCreateSuccess,
    } = useAssets();

    const totalPages = Math.ceil(total / limit);
    const isHR = role === "HR";

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <Package className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                Assets Management
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                                {isHR
                                    ? "View and manage all company assets"
                                    : "View your assigned assets"}
                            </p>
                        </div>
                    </div>
                    {isHR && (
                        <Button
                            onClick={handleOpenCreate}
                            className="h-11 font-semibold gap-2 whitespace-nowrap rounded-xl px-5"
                        >
                            <Plus className="h-5 w-5" />
                            Add Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards — HR only */}
            {isHR && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors border border-blue-500/10 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Package className="h-20 w-20 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Package className="h-4.5 w-4.5 text-blue-500" />
                            </div>
                            <h3 className="font-semibold text-blue-600/80 dark:text-blue-400 text-sm">Total</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">{stats.totalAssets}</p>
                    </div>
                    <div className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors border border-emerald-500/10 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 className="h-20 w-20 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                            </div>
                            <h3 className="font-semibold text-emerald-600/80 dark:text-emerald-400 text-sm">Available</h3>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{stats.availableCount}</p>
                    </div>
                    <div className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/10 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wrench className="h-20 w-20 text-amber-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Wrench className="h-4.5 w-4.5 text-amber-500" />
                            </div>
                            <h3 className="font-semibold text-amber-600/80 dark:text-amber-400 text-sm">Maintenance</h3>
                        </div>
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{stats.maintenanceCount}</p>
                    </div>
                    <div className="bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trash2 className="h-20 w-20 text-red-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Trash2 className="h-4.5 w-4.5 text-red-500" />
                            </div>
                            <h3 className="font-semibold text-red-600/80 dark:text-red-400 text-sm">Disposed</h3>
                        </div>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-500">{stats.disposedCount}</p>
                    </div>
                </div>
            )}

            {/* Filters — HR only */}
            {isHR && (
                <div className="flex flex-wrap items-center gap-3 px-2">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-44 h-9 text-sm">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={handleDepartmentFilter}>
                        <SelectTrigger className="w-52 h-9 text-sm">
                            <SelectValue placeholder="All Departments" />
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

                    {/* Employee search filter */}
                    <div className="flex items-center gap-2">
                        <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeSearchOpen}
                                    className={cn(
                                        "w-56 justify-between font-normal h-9 text-sm",
                                        selectedEmployee && "border-primary/20 bg-primary/5"
                                    )}
                                >
                                    {selectedEmployee ? (
                                        <span className="flex items-center gap-2 truncate">
                                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                                                {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                                            </span>
                                            <span className="truncate">
                                                {selectedEmployee.firstName} {selectedEmployee.lastName}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Search employee...</span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Type a name to search..."
                                        value={employeeSearchQuery}
                                        onValueChange={handleEmployeeSearchChange}
                                    />
                                    <CommandList>
                                        {employeeSearching ? (
                                            <div className="flex items-center justify-center py-6 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                <span className="text-sm">Searching...</span>
                                            </div>
                                        ) : employeeSearchQuery.trim().length < 2 ? (
                                            <div className="flex flex-col items-center py-6 text-muted-foreground">
                                                <Search className="h-6 w-6 mb-2 opacity-40" />
                                                <span className="text-xs">Type at least 2 characters</span>
                                            </div>
                                        ) : employeeSearchResults.length === 0 ? (
                                            <CommandEmpty>
                                                <div className="flex flex-col items-center py-4 text-muted-foreground">
                                                    <UserCircle className="h-6 w-6 mb-2 opacity-40" />
                                                    <span className="text-xs">No employee found</span>
                                                </div>
                                            </CommandEmpty>
                                        ) : (
                                            <CommandGroup>
                                                {employeeSearchResults.map((user) => (
                                                    <CommandItem
                                                        key={user._id}
                                                        value={user._id}
                                                        onSelect={() => handleSelectEmployee(user)}
                                                        className="flex items-center gap-3 py-2"
                                                    >
                                                        <span className={cn(
                                                            "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0",
                                                            selectedEmployee?._id === user._id
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </span>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium truncate text-sm">
                                                                {user.firstName} {user.lastName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                        {user.deptId && (
                                                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 shrink-0">
                                                                {user.deptId.name}
                                                            </Badge>
                                                        )}
                                                        <Check
                                                            className={cn(
                                                                "h-4 w-4 text-primary shrink-0",
                                                                selectedEmployee?._id === user._id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedEmployee && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                onClick={handleClearEmployee}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-base font-medium animate-pulse">Loading assets...</p>
                    </div>
                ) : (
                    <>
                        <AssetTable
                            assets={assets}
                            isHR={isHR}
                            startIndex={(page - 1) * limit + 1}
                        />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                <p className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    <span className="font-semibold text-foreground">
                                        {(page - 1) * limit + 1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-semibold text-foreground">
                                        {Math.min(page * limit, total)}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold text-foreground">{total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
            {isHR && (
                <CreateAssetModal
                    isOpen={isCreateOpen}
                    onClose={handleCloseCreate}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}
