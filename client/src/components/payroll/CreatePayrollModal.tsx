import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import ApiCaller from '@/utils/ApiCaller';

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

interface BonusDeductionItem {
    reason: string;
    amount: number;
}

interface CreatePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    salaries: Salary[];
    onSuccess: () => void;
}

const CreatePayrollModal: React.FC<CreatePayrollModalProps> = ({ isOpen, onClose, user, salaries, onSuccess }) => {
    const [selectedSalary, setSelectedSalary] = useState<string>('');
    const [month, setMonth] = useState<string>((new Date().getMonth() === 0 ? 12 : new Date().getMonth()).toString()); // default to previous month
    const [year, setYear] = useState<string>((new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()).toString());

    const [bonuses, setBonuses] = useState<BonusDeductionItem[]>([]);
    const [deductions, setDeductions] = useState<BonusDeductionItem[]>([]);

    const [newBonus, setNewBonus] = useState<BonusDeductionItem>({ reason: '', amount: 0 });
    const [newDeduction, setNewDeduction] = useState<BonusDeductionItem>({ reason: '', amount: 0 });

    const [loadingDeductions, setLoadingDeductions] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const userSalaries = user ? salaries.filter(s => {
        if (typeof s.userId === 'string') return s.userId === user._id;
        return s.userId && s.userId._id === user._id;
    }) : [];

    const activeSalaryObj = userSalaries.find(s => s._id === selectedSalary);

    useEffect(() => {
        if (isOpen) {
            setSelectedSalary('');
            setBonuses([]);
            setDeductions([]);
            setMonth((new Date().getMonth() === 0 ? 12 : new Date().getMonth()).toString());
            setYear((new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()).toString());
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchLeaveDeductions = async () => {
            if (!user?._id || !month || !year || !selectedSalary) return;
            setLoadingDeductions(true);
            try {
                const { response } = await ApiCaller<any, any>({
                    requestType: 'GET',
                    paths: ['api', 'v1', 'payroll', 'deduction', user._id],
                    queryParams: { month, year, salary: selectedSalary }
                });

                if (response?.data?.deductionsOnLeave) {
                    setDeductions(prev => {
                        const customDeductions = prev.filter(p => !response.data.deductionsOnLeave.some((l: any) => l.reason === p.reason));
                        return [...customDeductions, ...response.data.deductionsOnLeave];
                    });
                }
            } catch (err) {
                console.error("Failed to fetch leave deductions", err);
            } finally {
                setLoadingDeductions(false);
            }
        };

        fetchLeaveDeductions();
    }, [user?._id, month, year, selectedSalary]);

    const handleAddBonus = () => {
        if (newBonus.reason && newBonus.amount > 0) {
            setBonuses([...bonuses, { ...newBonus }]);
            setNewBonus({ reason: '', amount: 0 });
        }
    };

    const handleAddDeduction = () => {
        if (newDeduction.reason && newDeduction.amount > 0) {
            setDeductions([...deductions, { ...newDeduction }]);
            setNewDeduction({ reason: '', amount: 0 });
        }
    };

    const removeBonus = (index: number) => {
        setBonuses(bonuses.filter((_, i) => i !== index));
    };

    const removeDeduction = (index: number) => {
        setDeductions(deductions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user || !selectedSalary || !month || !year) return;
        setSubmitting(true);
        try {
            await ApiCaller({
                requestType: 'POST',
                paths: ['api', 'v1', 'payroll'],
                body: {
                    user: user._id,
                    salary: selectedSalary,
                    month: Number(month),
                    year: Number(year),
                    bonus: bonuses,
                    deduction: deductions
                }
            });
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to create payroll");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                                            Base: {s.base} | HRA: {s.hra}
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
                                <div><span className="text-gray-500 font-medium">Base:</span> <span>${activeSalaryObj.base}</span></div>
                                <div><span className="text-gray-500 font-medium">HRA:</span> <span>${activeSalaryObj.hra}</span></div>
                                <div><span className="text-gray-500 font-medium">LTA:</span> <span>${activeSalaryObj.lta}</span></div>
                                <div className="font-bold text-indigo-700">Gross: ${activeSalaryObj.base + activeSalaryObj.hra + activeSalaryObj.lta}</div>
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
                    <Button onClick={handleSubmit} disabled={!selectedSalary || submitting} className="bg-indigo-600 hover:bg-indigo-700">
                        {submitting ? 'Generating...' : 'Generate Payroll'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePayrollModal;
