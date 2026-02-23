import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useCreatePayrollModal } from '@/hooks/payroll/useCreatePayrollModal';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Salary {
    _id: string;
    userId: User | string;
    base: number;
    hra: number;
    lta: number;
}

interface CreatePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    salaries: Salary[];
    onSuccess: () => void;
}

const CreatePayrollModal: React.FC<CreatePayrollModalProps> = ({ isOpen, onClose, user, salaries, onSuccess }) => {
    const {
        selectedSalary, setSelectedSalary,
        month, setMonth,
        year, setYear,
        bonuses,
        deductions,
        newBonus, setNewBonus,
        newDeduction, setNewDeduction,
        loadingDeductions,
        submitting,
        userSalaries,
        activeSalaryObj,
        handleAddBonus,
        handleAddDeduction,
        removeBonus,
        removeDeduction,
        handleSubmit
    } = useCreatePayrollModal({ isOpen, onClose, user, salaries, onSuccess });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Payroll - {user?.firstName} {user?.lastName}</DialogTitle>
                    <DialogDescription>
                        Generate a new payroll record for this employee. Select the period and review salary breakdown.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Salary Profile</Label>
                            <Select value={selectedSalary} onValueChange={setSelectedSalary}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Salary" />
                                </SelectTrigger>
                                <SelectContent>
                                    {userSalaries.map(s => (
                                        <SelectItem key={s._id} value={s._id}>
                                            Base: {s.base.toFixed(2)} | HRA: {s.hra.toFixed(2)}
                                        </SelectItem>
                                    ))}
                                    {userSalaries.length === 0 && (
                                        <SelectItem value="none" disabled>No salary found</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026].map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Month (1-12)</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {activeSalaryObj && (
                        <Card className="bg-gray-50 border-gray-100">
                            <CardContent className="p-4 flex justify-between">
                                <div><span className="text-gray-500 font-medium">Base:</span> <span>${activeSalaryObj.base.toFixed(2)}</span></div>
                                <div><span className="text-gray-500 font-medium">HRA:</span> <span>${activeSalaryObj.hra.toFixed(2)}</span></div>
                                <div><span className="text-gray-500 font-medium">LTA:</span> <span>${activeSalaryObj.lta.toFixed(2)}</span></div>
                                <div className="font-bold ">Gross: ${(activeSalaryObj.base + activeSalaryObj.hra + activeSalaryObj.lta).toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        {/* Bonuses */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm">Bonuses</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Reason"
                                    value={newBonus.reason}
                                    onChange={e => setNewBonus({ ...newBonus, reason: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    className="w-24"
                                    value={newBonus.amount === 0 ? '' : newBonus.amount}
                                    onChange={e => setNewBonus({ ...newBonus, amount: Number(e.target.value) })}
                                />
                                <Button type="button" size="icon" onClick={handleAddBonus}><Plus size={16} /></Button>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                {bonuses.map((b, i) => (
                                    <div key={i} className="flex justify-between items-center bg-green-50 p-2 rounded text-sm text-green-700">
                                        <span>{b.reason}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold">+${b.amount}</span>
                                            <button onClick={() => removeBonus(i)} className="text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm">Deductions</h4>
                                {loadingDeductions && <span className="text-xs text-blue-500 animate-pulse">Loading leave deductions...</span>}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Reason"
                                    value={newDeduction.reason}
                                    onChange={e => setNewDeduction({ ...newDeduction, reason: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    className="w-24"
                                    value={newDeduction.amount === 0 ? '' : newDeduction.amount}
                                    onChange={e => setNewDeduction({ ...newDeduction, amount: Number(e.target.value) })}
                                />
                                <Button type="button" size="icon" onClick={handleAddDeduction}><Plus size={16} /></Button>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                {deductions.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center bg-red-50 p-2 rounded text-sm text-red-700">
                                        <span>{d.reason}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold">-${d.amount}</span>
                                            <button onClick={() => removeDeduction(i)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!selectedSalary || submitting}>
                        {submitting ? 'Generating...' : 'Generate Payroll'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePayrollModal;
