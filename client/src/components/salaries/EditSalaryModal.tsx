import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    DollarSign,
    Wallet,
    Home,
    Plane,
    Pencil,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { useEditSalaryModal } from '@/hooks/salaries/useEditSalaryModal';

interface EditSalaryFormData {
    baseSalary: number;
    hra: number;
    lta: number;
}

interface EditSalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeName: string;
    salaryData: EditSalaryFormData | null;
    onSubmit: (data: EditSalaryFormData) => Promise<void>;
    loading: boolean;
}

const EditSalaryModal: React.FC<EditSalaryModalProps> = ({
    isOpen,
    onClose,
    employeeName,
    salaryData,
    onSubmit,
    loading,
}) => {
    const { formData, error, fieldErrors, handleInputChange, handleSubmit } =
        useEditSalaryModal({ isOpen, salaryData, onSubmit });

    const totalSalary = useMemo(
        () => (formData.baseSalary || 0) + (formData.hra || 0) + (formData.lta || 0),
        [formData.baseSalary, formData.hra, formData.lta]
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-135 p-0 overflow-hidden border-0 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="px-6 pt-6 pb-5">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/50 backdrop-blur-sm">
                                <Pencil className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    Edit Salary Structure
                                </DialogTitle>
                                <DialogDescription className="text-sm mt-0.5">
                                    Update the salary details for {employeeName}.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Form Content */}
                <div className="px-6 pb-6 pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Banner */}
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Salary Components Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold">Salary Components</span>
                            </div>

                            <div className="grid gap-4">
                                {/* Base Salary */}
                                <div className="group rounded-xl border-2 border-transparent bg-emerald-50/50 p-4 transition-all hover:border-emerald-200 dark:bg-emerald-950/20 dark:hover:border-emerald-800">
                                    <Label htmlFor="baseSalary" className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/10">
                                            <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        Base Salary <b className="text-red-500">*</b>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-sm">$</span>
                                        <Input
                                            id="baseSalary"
                                            name="baseSalary"
                                            type="number"
                                            min="0"
                                            value={formData.baseSalary}
                                            onChange={handleInputChange}
                                            className="pl-7 h-11 rounded-lg border-emerald-200 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    {fieldErrors.baseSalary && (
                                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> {fieldErrors.baseSalary}
                                        </p>
                                    )}
                                </div>

                                {/* HRA & LTA side by side */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* HRA */}
                                    <div className="group rounded-xl border-2 border-transparent bg-blue-50/50 p-4 transition-all hover:border-blue-200 dark:bg-blue-950/20 dark:hover:border-blue-800">
                                        <Label htmlFor="hra" className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                                            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/10">
                                                <Home className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            HRA
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-semibold text-sm">$</span>
                                            <Input
                                                id="hra"
                                                name="hra"
                                                type="number"
                                                min="0"
                                                value={formData.hra}
                                                onChange={handleInputChange}
                                                className="pl-7 h-11 rounded-lg border-blue-200 focus-visible:ring-blue-500/30 dark:border-blue-800"
                                                placeholder="0"
                                            />
                                        </div>
                                        {fieldErrors.hra && (
                                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> {fieldErrors.hra}
                                            </p>
                                        )}
                                    </div>

                                    {/* LTA */}
                                    <div className="group rounded-xl border-2 border-transparent bg-purple-50/50 p-4 transition-all hover:border-purple-200 dark:bg-purple-950/20 dark:hover:border-purple-800">
                                        <Label htmlFor="lta" className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
                                            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/10">
                                                <Plane className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            LTA
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-semibold text-sm">$</span>
                                            <Input
                                                id="lta"
                                                name="lta"
                                                type="number"
                                                min="0"
                                                value={formData.lta}
                                                onChange={handleInputChange}
                                                className="pl-7 h-11 rounded-lg border-purple-200 focus-visible:ring-purple-500/30 dark:border-purple-800"
                                                placeholder="0"
                                            />
                                        </div>
                                        {fieldErrors.lta && (
                                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> {fieldErrors.lta}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Total Preview */}
                        <Separator />
                        <div className="rounded-xl bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border border-emerald-200/60 dark:border-emerald-800/40 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-white">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total CTC</p>
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                            ${totalSalary.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                                    <p>Base: <span className="font-medium text-emerald-600">${(formData.baseSalary || 0).toLocaleString()}</span></p>
                                    <p>HRA: <span className="font-medium text-blue-600">${(formData.hra || 0).toLocaleString()}</span></p>
                                    <p>LTA: <span className="font-medium text-purple-600">${(formData.lta || 0).toLocaleString()}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <DialogFooter className="gap-2 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="rounded-lg px-5"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg px-6 font-semibold gap-2  text-white shadow-lg "
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Pencil className="h-4 w-4" />
                                        Update Salary
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditSalaryModal;
