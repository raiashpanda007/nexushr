import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSalaryModal } from '@/hooks/salaries/useSalaryModal';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deptId?: {
        _id: string;
        name: string;
    };
}

interface SalaryFormData {
    userId: string;
    baseSalary: number;
    hra: number;
    lta: number;
}

interface SalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    salaryData?: SalaryFormData | null; // If present, it's edit mode
    onSubmit: (data: SalaryFormData) => Promise<void>;
    loading: boolean;
    isEditMode: boolean;
}

const SalaryModal: React.FC<SalaryModalProps> = ({
    isOpen,
    onClose,
    users,
    salaryData,
    onSubmit,
    loading,
    isEditMode,
}) => {
    const { formData, error, fieldErrors, handleInputChange, handleUserChange, handleSubmit } = useSalaryModal({ isOpen, salaryData, onSubmit, isEditMode });
    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);

    const selectedUser = users.find(user => user._id === formData.userId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none">
                <Card className="w-full h-full border-none shadow-none bg-background">
                    <DialogHeader className="px-6 pt-6 mb-2">
                        <DialogTitle>
                            {isEditMode ? 'Edit Salary Structure' : 'Create Salary Structure'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? 'Update the salary details for this employee.'
                                : 'Assign salary structure to a new employee.'}
                        </DialogDescription>
                    </DialogHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            {!isEditMode && (
                                <div className="space-y-2">
                                    <Label htmlFor="userId">Employee</Label>
                                    <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={employeeSearchOpen}
                                                className="w-full justify-between font-normal"
                                            >
                                                {selectedUser
                                                    ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
                                                    : "Select an employee..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search employee by name or email..." />
                                                <CommandList>
                                                    <CommandEmpty>No employee found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {users.map((user) => (
                                                            <CommandItem
                                                                key={user._id}
                                                                value={`${user.firstName} ${user.lastName} ${user.email}`}
                                                                onSelect={() => {
                                                                    handleUserChange(user._id);
                                                                    setEmployeeSearchOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.userId === user._id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {user.firstName} {user.lastName} ({user.email})
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {fieldErrors.userId && <p className="text-red-500 text-xs">{fieldErrors.userId}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="baseSalary">Base Salary</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <Input
                                        id="baseSalary"
                                        name="baseSalary"
                                        type="number"
                                        min="0"
                                        value={formData.baseSalary}
                                        onChange={handleInputChange}
                                        className="pl-7"
                                        required
                                    />
                                </div>
                                {fieldErrors.baseSalary && <p className="text-red-500 text-xs">{fieldErrors.baseSalary}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hra">HRA</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <Input
                                        id="hra"
                                        name="hra"
                                        type="number"
                                        min="0"
                                        value={formData.hra}
                                        onChange={handleInputChange}
                                        className="pl-7"
                                    />
                                </div>
                                {fieldErrors.hra && <p className="text-red-500 text-xs">{fieldErrors.hra}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lta">LTA</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <Input
                                        id="lta"
                                        name="lta"
                                        type="number"
                                        min="0"
                                        value={formData.lta}
                                        onChange={handleInputChange}
                                        className="pl-7"
                                    />
                                </div>
                                {fieldErrors.lta && <p className="text-red-500 text-xs">{fieldErrors.lta}</p>}
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Salary'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
};

export default SalaryModal;
