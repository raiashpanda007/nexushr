
import React from 'react';
import {
    Edit2,
    Trash2,
    DollarSign,
    Users,
    Wallet,
    Home,
    Plane,
    TrendingUp,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

interface Salary {
    _id: string;
    userId: User;
    base: number;
    hra: number;
    lta: number;
    createdAt: string;
}

interface SalaryTableProps {
    salaries: Salary[];
    isHR: boolean;
    onEdit: (salary: Salary) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
}

const SalaryTable: React.FC<SalaryTableProps> = ({ salaries, isHR, onEdit, onDelete, loading }) => {
    if (salaries.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Wallet className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No salaries configured yet</p>
                    <p className="text-sm mt-1">Create a salary structure to get started.</p>
                </CardContent>
            </Card>
        );
    }

    const totalPayroll = salaries.reduce(
        (sum, s) => sum + s.base + s.hra + s.lta,
        0
    );

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            {/* Gradient Header */}
            <CardHeader className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 sm:p-8 shadow-xl shadow-primary/20 border border-primary/10 text-white py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Employee Salaries</CardTitle>
                            <p className="text-slate-400 text-sm mt-0.5">{salaries.length} employee{salaries.length !== 1 ? 's' : ''} configured</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 ">
                        <div className="text-right bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Monthly Payroll</p>
                            <p className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {totalPayroll.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="font-semibold">Employee</TableHead>
                            <TableHead className="font-semibold">Department</TableHead>
                            <TableHead className="text-right font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Wallet className="h-3.5 w-3.5 text-emerald-500" /> Base
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Home className="h-3.5 w-3.5 text-blue-500" /> HRA
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Plane className="h-3.5 w-3.5 text-purple-500" /> LTA
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Total CTC
                                </span>
                            </TableHead>
                            {isHR && <TableHead className="text-right font-semibold">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salaries.map((salary, index) => {
                            const total = salary.base + salary.hra + salary.lta;
                            return (
                                <TableRow
                                    key={salary._id}
                                    className={cn(
                                        "transition-colors group",
                                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                    )}
                                >
                                    {/* Employee Info - Combined name + email */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shrink-0 shadow-sm">
                                                {salary.userId?.firstName?.[0]}{salary.userId?.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {salary.userId?.firstName} {salary.userId?.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {salary.userId?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Department */}
                                    <TableCell>
                                        {salary.userId?.deptId ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                                            >
                                                {salary.userId.deptId.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm italic">Unassigned</span>
                                        )}
                                    </TableCell>

                                    {/* Base */}
                                    <TableCell className="text-right">
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            ${salary.base.toLocaleString()}
                                        </span>
                                    </TableCell>

                                    {/* HRA */}
                                    <TableCell className="text-right">
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                            ${salary.hra.toLocaleString()}
                                        </span>
                                    </TableCell>

                                    {/* LTA */}
                                    <TableCell className="text-right">
                                        <span className="font-medium text-purple-600 dark:text-purple-400">
                                            ${salary.lta.toLocaleString()}
                                        </span>
                                    </TableCell>

                                    {/* Total */}
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {total.toLocaleString()}
                                        </span>
                                    </TableCell>

                                    {/* Actions */}
                                    {isHR && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(salary)}
                                                    title="Edit Salary"
                                                    disabled={loading}
                                                    className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDelete(salary._id)}
                                                    title="Delete Salary"
                                                    disabled={loading}
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default SalaryTable;
