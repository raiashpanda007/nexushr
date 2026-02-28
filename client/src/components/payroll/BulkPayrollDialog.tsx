import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useBulkPayroll } from '@/hooks/Payroll/useBulkPayroll';
import { Plus, Trash2 } from 'lucide-react';

interface BulkPayrollDialogProps {
    bulkPayroll: ReturnType<typeof useBulkPayroll>;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' }),
}));

const YEARS = [2024, 2025, 2026, 2027];

const BulkPayrollDialog = ({ bulkPayroll }: BulkPayrollDialogProps) => {
    const {
        isBulkDialogOpen,
        setIsBulkDialogOpen,
        departmentList,
        selectedDepartments,
        bulkLoading,
        bulkError,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        handleDepartmentToggle,
        handleGenerateBulk,
        closeDialog,
        bulkBonus,
        bulkDeduction,
        addBulkBonus,
        removeBulkBonus,
        updateBulkBonus,
        addBulkDeduction,
        removeBulkDeduction,
        updateBulkDeduction,
    } = bulkPayroll;

    return (
        <Dialog
            open={isBulkDialogOpen}
            onOpenChange={(open) => {
                if (!open) closeDialog();
                else setIsBulkDialogOpen(true);
            }}
        >
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Bulk Payroll</DialogTitle>
                    <DialogDescription>Select month, year, and one or more departments.</DialogDescription>
                </DialogHeader>

                {/* Month & Year Selectors */}
                <div className="flex gap-3">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-sm font-medium">Month</Label>
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(val) => setSelectedMonth(Number(val))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m) => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-sm font-medium">Year</Label>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(val) => setSelectedYear(Number(val))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    If no department is selected, it will be considered as All departments.
                </div>

                {bulkError && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                        {bulkError}
                    </div>
                )}

                <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-2">
                    {departmentList.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No departments found.</p>
                    ) : (
                        departmentList.map((dept) => (
                            <div key={dept._id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`bulk-dept-${dept._id}`}
                                    checked={selectedDepartments.includes(dept._id)}
                                    onCheckedChange={() => handleDepartmentToggle(dept._id)}
                                />
                                <Label htmlFor={`bulk-dept-${dept._id}`} className="font-normal cursor-pointer">
                                    {dept.name}
                                </Label>
                            </div>
                        ))
                    )}
                </div>

                {/* Bulk Bonus */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Bulk Bonus</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addBulkBonus} className="gap-1 h-7 text-xs">
                            <Plus className="h-3 w-3" /> Add
                        </Button>
                    </div>
                    {bulkBonus.length > 0 && (
                        <div className="space-y-2 border rounded-md p-3">
                            {bulkBonus.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Reason"
                                        value={item.reason}
                                        onChange={(e) => updateBulkBonus(index, 'reason', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Amount"
                                        value={item.amount || ''}
                                        onChange={(e) => updateBulkBonus(index, 'amount', Number(e.target.value))}
                                        className="w-28"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBulkBonus(index)} className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bulk Deduction */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Bulk Deduction</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addBulkDeduction} className="gap-1 h-7 text-xs">
                            <Plus className="h-3 w-3" /> Add
                        </Button>
                    </div>
                    {bulkDeduction.length > 0 && (
                        <div className="space-y-2 border rounded-md p-3">
                            {bulkDeduction.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Reason"
                                        value={item.reason}
                                        onChange={(e) => updateBulkDeduction(index, 'reason', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Amount"
                                        value={item.amount || ''}
                                        onChange={(e) => updateBulkDeduction(index, 'amount', Number(e.target.value))}
                                        className="w-28"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBulkDeduction(index)} className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={closeDialog} disabled={bulkLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerateBulk} disabled={bulkLoading}>
                        {bulkLoading ? 'Generating...' : 'Generate Bulk'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkPayrollDialog;
