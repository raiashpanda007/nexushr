import { Search, FileText, CheckCircle2, Receipt, ChevronLeft, ChevronRight, Loader2, Users, DollarSign, TrendingUp, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CreatePayrollModal from '@/components/payroll/CreatePayrollModal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { usePayroll } from "@/hooks/Payroll/usePayroll";


const Payroll = () => {
    function GeneratePdf(data: {
        BaseSalary: number; HRA: number; LTA: number; Bonus: { reason: string; amount: number }[]; deduction: { reason: string; amount: number }[];
        createdAt: string;
        syncState?: "unsynced" | "synced";
    }) {
        const worker = new Worker(new URL("../../workers/pdf.worker.tsx", import.meta.url));

        worker.postMessage(data);

        worker.onmessage = (e) => {
            const blob = e.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "payroll.pdf";
            link.click();
            URL.revokeObjectURL(url);
        };
    }


    const {
        isHR,
        salaries,
        loading,
        userSearchTerm,
        setUserSearchTerm,
        filterYear,
        setFilterYear,
        filterMonth,
        setFilterMonth,
        isModalOpen,
        setIsModalOpen,
        selectedUser,
        page,
        setPage,
        total,
        limit,
        usersPage,
        setUsersPage,
        usersTotal,
        usersLimit,
        handleOpenModal,
        handleModalSuccess,
        filteredUsers,
        filteredPayrolls,
        getUserName,
        calculateTotals,
        payrollPage,
        setPayrollPage,
        payrollTotal,
        payrollLimit,
    } = usePayroll();

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50/50 via-background to-blue-50/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-medium text-muted-foreground">Loading payroll data...</p>
                </div>
            </div>
        );
    }

    const totalEmployeePages = Math.ceil(total / limit);
    const usersPages = Math.ceil(usersTotal / usersLimit);
    const payrollPages = Math.ceil(payrollTotal / payrollLimit);

    if (!isHR) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50/50 via-background to-blue-50/30 p-6 space-y-6">
                {/* Employee Header */}
                <div className="rounded-2xl bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
                                <Receipt className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">My Payrolls</h1>
                                <p className="text-white/70 text-sm mt-0.5">View your salary slips and payment history</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Select value={filterYear || "all"} onValueChange={(val) => {
                                if (val === "all") { setFilterYear(''); setFilterMonth(''); } else { setFilterYear(val); }
                            }}>
                                <SelectTrigger className="w-32 bg-white/15 border-white/20 text-white">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-muted-foreground italic">All Years</SelectItem>
                                    {[2024, 2025, 2026].map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterMonth || "all"} onValueChange={(val) => {
                                if (val === "all") setFilterMonth(''); else setFilterMonth(val);
                            }} disabled={!filterYear}>
                                <SelectTrigger className="w-36 bg-white/15 border-white/20 text-white">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-muted-foreground italic">All Months</SelectItem>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                            {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {filteredPayrolls.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-12 flex flex-col items-center justify-center text-center">
                        <Receipt className="w-10 h-10 mb-3 text-indigo-400" />
                        <p className="font-medium text-muted-foreground">No payrolls found matching your filters.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPayrolls.map(p => {
                            const pDate = new Date(p.createdAt);
                            const pYear = pDate.getFullYear();
                            const pMonth = (pDate.getMonth() + 1).toString().padStart(2, '0');
                            const { totalBonus, totalDeduction, baseSalary, netSalary } = calculateTotals(p);
                            return (
                                <Card key={p._id} className="border-border hover:shadow-md transition-shadow overflow-hidden">
                                    <div className="h-1 bg-linear-to-r from-indigo-500 via-blue-500 to-cyan-500" />
                                    <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-xl">{pMonth} / {pYear}</h3>
                                                {p.syncState === 'unsynced' && (
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 uppercase text-[10px] tracking-wider font-semibold">
                                                        Unsynced
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm mt-3">
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                                                    <DollarSign className="h-3.5 w-3.5" /> Base: ${baseSalary.toFixed(2)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium">
                                                    <TrendingUp className="h-3.5 w-3.5" /> +${totalBonus.toFixed(2)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium">
                                                    <Minus className="h-3.5 w-3.5" /> -${totalDeduction.toFixed(2)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                                                    Net: ${netSalary.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">
                                                <CheckCircle2 size={14} className="mr-1" /> Processed
                                            </Badge>
                                            <Button size="sm" variant="outline" className="gap-2 shadow-sm" onClick={() => GeneratePdf({
                                                BaseSalary: baseSalary, HRA: p.salary.HRA, LTA: p.salary.LTA,
                                                Bonus: p.bonus, deduction: p.deduction, createdAt: p.createdAt, syncState: p.syncState
                                            })}>
                                                <FileText size={14} /> Print
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card rounded-xl border">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="gap-1">
                                        <ChevronLeft className="h-4 w-4" /> Previous
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground px-2">{page} / {totalEmployeePages || 1}</span>
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalEmployeePages, p + 1))} disabled={page === totalEmployeePages || totalEmployeePages === 0} className="gap-1">
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50/50 via-background to-emerald-50/30 p-6 space-y-6">
            {/* HR Header */}
            <div className="rounded-2xl bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
                        <Receipt className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Payroll Processing</h1>
                        <p className="text-white/70 text-sm mt-0.5">Generate and review payroll information across the organization</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Employee List Section */}
                <Card className="shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-lg">Employees</CardTitle>
                        </div>
                        <CardDescription>Select an employee to generate their payroll</CardDescription>
                        <div className="mt-3 relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                            <Input
                                type="text"
                                placeholder="Search employees..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="pl-9 border-indigo-200 focus-visible:ring-indigo-300"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-150 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-indigo-50/50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="text-indigo-700 font-semibold">Employee</TableHead>
                                        <TableHead className="text-right text-indigo-700 font-semibold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                <Users className="h-8 w-8 mx-auto mb-2 text-indigo-300" />
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.map((user) => (
                                        <TableRow key={user._id} className="hover:bg-indigo-50/40 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleOpenModal(user)} variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                    <FileText size={14} /> Create Payroll
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {usersTotal > 0 && !userSearchTerm && (
                            <div className="p-4 flex justify-between items-center border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(usersPage - 1) * usersLimit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(usersPage * usersLimit, usersTotal)}</span> of <span className="font-semibold text-foreground">{usersTotal}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="gap-1">
                                        <ChevronLeft className="h-4 w-4" /> Prev
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground px-1">{usersPage} / {usersPages || 1}</span>
                                    <Button variant="outline" size="sm" onClick={() => setUsersPage(p => Math.min(usersPages, p + 1))} disabled={usersPage === usersPages || usersPages === 0} className="gap-1">
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payrolls List Section */}
                <Card className="shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-lg">Generated Payrolls</CardTitle>
                        </div>
                        <CardDescription>View and filter processed payrolls</CardDescription>
                        <div className="mt-3 flex gap-3">
                            <Select value={filterYear || "all"} onValueChange={(val) => {
                                if (val === "all") { setFilterYear(''); setFilterMonth(''); } else { setFilterYear(val); }
                            }}>
                                <SelectTrigger className="w-32 border-emerald-200">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-muted-foreground italic">All Years</SelectItem>
                                    {[2024, 2025, 2026].map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterMonth || "all"} onValueChange={(val) => {
                                if (val === "all") setFilterMonth(''); else setFilterMonth(val);
                            }} disabled={!filterYear}>
                                <SelectTrigger className="w-36 border-emerald-200">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-muted-foreground italic">All Months</SelectItem>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                            {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-150 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-emerald-50/50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="text-emerald-700 font-semibold">Employee</TableHead>
                                        <TableHead className="text-emerald-700 font-semibold">Period</TableHead>
                                        <TableHead className="text-right text-emerald-700 font-semibold">Net Salary</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayrolls.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                <Receipt className="h-8 w-8 mx-auto mb-2 text-emerald-300" />
                                                No payrolls match your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredPayrolls.map((p) => {
                                        const pDate = new Date(p.createdAt);
                                        const pYear = pDate.getFullYear();
                                        const pMonth = (pDate.getMonth() + 1).toString().padStart(2, '0');
                                        const { totalBonus, totalDeduction, baseSalary, netSalary } = calculateTotals(p);
                                        return (
                                            <TableRow key={p._id} className="hover:bg-emerald-50/40 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {getUserName(p.user)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{pMonth}/{pYear}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-border">
                                                            <span className="text-slate-600 font-medium">${baseSalary.toFixed(2)}</span>
                                                            <span className="text-emerald-600 font-medium">+{totalBonus.toFixed(2)}</span>
                                                            <span className="text-red-500 font-medium">-{totalDeduction.toFixed(2)}</span>
                                                        </div>
                                                        <div className="font-bold text-emerald-700 px-1">
                                                            ${netSalary.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {payrollTotal > 0 && (
                            <div className="p-4 flex justify-between items-center border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(payrollPage - 1) * payrollLimit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(payrollPage * payrollLimit, payrollTotal)}</span> of <span className="font-semibold text-foreground">{payrollTotal}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPayrollPage(p => Math.max(1, p - 1))} disabled={payrollPage === 1} className="gap-1">
                                        <ChevronLeft className="h-4 w-4" /> Prev
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground px-1">{payrollPage} / {payrollPages || 1}</span>
                                    <Button variant="outline" size="sm" onClick={() => setPayrollPage(p => Math.min(payrollPages, p + 1))} disabled={payrollPage === payrollPages || payrollPages === 0} className="gap-1">
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {selectedUser && (
                <CreatePayrollModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={selectedUser}
                    salaries={salaries}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default Payroll;
