
import React, { useEffect, useState } from 'react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    const [formData, setFormData] = useState<SalaryFormData>({
        userId: '',
        baseSalary: 0,
        hra: 0,
        lta: 0,
    });

    useEffect(() => {
        if (isOpen) {
            if (salaryData) {
                setFormData(salaryData);
            } else {
                setFormData({
                    userId: '',
                    baseSalary: 0,
                    hra: 0,
                    lta: 0,
                });
            }
        }
    }, [isOpen, salaryData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: Number(value),
        }));
    };

    const handleUserChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            userId: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

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
                            {!isEditMode && (
                                <div className="space-y-2">
                                    <Label htmlFor="userId">Employee</Label>
                                    <Select
                                        value={formData.userId}
                                        onValueChange={handleUserChange}
                                    >
                                        <SelectTrigger id="userId">
                                            <SelectValue placeholder="Select an employee" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {users.map((user) => (
                                                <SelectItem key={user._id} value={user._id}>
                                                    {user.firstName} {user.lastName} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
