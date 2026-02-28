import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    } = bulkPayroll;

    return (
        <Dialog
            open={isBulkDialogOpen}
            onOpenChange={(open) => {
                if (!open) closeDialog();
                else setIsBulkDialogOpen(true);
            }}
        >
            <DialogContent className="sm:max-w-md">
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
