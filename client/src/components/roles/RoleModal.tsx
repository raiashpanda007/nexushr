import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRoleModal } from "@/hooks/Roles/useRoleModal";
import { AlertCircle, X, ChevronDown } from "lucide-react";
import type { Role } from "@/types";
import { useState } from "react";

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Role | null;
    onSuccess: () => void;
}

export default function RoleModal({ isOpen, onClose, initialData, onSuccess }: RoleModalProps) {
    const {
        formData,
        departments,
        employees,
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
    } = useRoleModal({ isOpen, onClose, initialData, onSuccess });

    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

    const filteredEmployees = employees.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearchQuery.toLowerCase())
    );

    const selectedEmployeeNames = employees
        .filter(emp => formData.users.includes(emp._id))
        .map(emp => `${emp.firstName} ${emp.lastName}`);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {initialData ? "Edit Role" : "Create New Role"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-5 py-4">
                    {error && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-destructive text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Role Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-semibold">
                            Role Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter role name"
                            className="h-10"
                            disabled={loading}
                        />
                        {fieldErrors.name && (
                            <p className="text-destructive text-xs font-medium">{fieldErrors.name}</p>
                        )}
                    </div>

                    {/* Department Selection */}
                    <div className="grid gap-2">
                        <Label className="text-sm font-semibold">
                            Department <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.departmentId} onValueChange={handleDepartmentChange} disabled={loading}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select a department first" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.departmentId && (
                            <p className="text-destructive text-xs font-medium">{fieldErrors.departmentId}</p>
                        )}
                    </div>

                    {/* Employee Selection with Combobox */}
                    {formData.departmentId && (
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">
                                Employees <span className="text-red-500">*</span>
                            </Label>
                            
                            {/* Combobox for employee search */}
                            <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={employeeSearchOpen}
                                        className="h-10 justify-between font-normal"
                                        disabled={loading || employees.length === 0}
                                    >
                                        <span className="truncate text-muted-foreground">
                                            {selectedEmployeeNames.length === 0
                                                ? "Search and select employees..."
                                                : `${selectedEmployeeNames.length} employee${selectedEmployeeNames.length !== 1 ? "s" : ""} selected`}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search by name or email..."
                                            value={employeeSearchQuery}
                                            onValueChange={setEmployeeSearchQuery}
                                        />
                                        <CommandEmpty>No employees found in this department</CommandEmpty>
                                        <CommandGroup>
                                            <ScrollArea className="h-64">
                                                {filteredEmployees.map((emp) => (
                                                    <CommandItem
                                                        key={emp._id}
                                                        value={emp._id}
                                                        onSelect={() => {
                                                            handleEmployeeToggle(emp._id);
                                                        }}
                                                        className="flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <Checkbox
                                                            checked={formData.users.includes(emp._id)}
                                                            onCheckedChange={() => handleEmployeeToggle(emp._id)}
                                                            className="pointer-events-none"
                                                        />
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
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Selected Employees Tags */}
                            {selectedEmployeeNames.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                                    {selectedEmployeeNames.map((name, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-foreground"
                                        >
                                            <span className="font-medium">{name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const emp = employees.find(e => `${e.firstName} ${e.lastName}` === name);
                                                    if (emp) handleEmployeeToggle(emp._id);
                                                }}
                                                className="hover:opacity-70 transition-opacity"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {employees.length === 0 && (
                                <div className="p-4 rounded-lg bg-muted/30 border border-border/40 text-center text-muted-foreground text-sm">
                                    No employees found in this department
                                </div>
                            )}

                            {fieldErrors.users && (
                                <p className="text-destructive text-xs font-medium">{fieldErrors.users}</p>
                            )}
                        </div>
                    )}

                    {/* Permissions Selection */}
                    <div className="grid gap-2">
                        <Label className="text-sm font-semibold">Permissions</Label>
                        <ScrollArea className="h-64 border rounded-lg border-border/60 p-3 bg-background/50">
                            <div className="space-y-4">
                                {modules.map((module) => (
                                    <div key={module} className="space-y-2">
                                        <h4 className="font-semibold text-sm text-gray-700">{module}</h4>
                                        <div className="grid grid-cols-2 gap-2 ml-2">
                                            {actions.map((action) => (
                                                <div key={`${module}-${action}`} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`${module}-${action}`}
                                                        checked={isModuleActionChecked(module, action)}
                                                        onCheckedChange={() =>
                                                            handleModuleActionToggle(module, action)
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <label
                                                        htmlFor={`${module}-${action}`}
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
                    </div>

                    <DialogFooter className="gap-2 pt-4 border-t border-border/40">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-10 font-semibold gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⌛</span>
                                    Saving...
                                </>
                            ) : (
                                initialData ? "Update Role" : "Create Role"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
