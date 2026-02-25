import { Search, FileText, CheckCircle2, Receipt, ChevronLeft, ChevronRight, Loader2, Users, DollarSign, TrendingUp, Minus, Download, X } from 'lucide-react';
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
import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { PayrollDocument } from "@/utils/PdfGenerator";
import type { PayrollDocumentProps } from "@/utils/PdfGenerator";


const Payroll = () => {
    const [pdfState, setPdfState] = useState<"idle" | "generating" | "ready" | "error">("idle");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfFilename, setPdfFilename] = useState("payroll.pdf");

    const GeneratePdf = useCallback(async (data: PayrollDocumentProps) => {
        setPdfState("generating");
        setPdfUrl(null);
        try {
            const blob = await pdf(<PayrollDocument {...data} />).toBlob();
            const url = URL.createObjectURL(blob);
            const date = new Date(data.createdAt);
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            const name = data.employeeName?.replace(/\s+/g, "_") || "payroll";
            setPdfFilename(`${name}_payslip_${month}_${year}.pdf`);
            setPdfUrl(url);
            setPdfState("ready");
        } catch (err) {
            console.error("PDF generation failed:", err);
            setPdfState("error");
        }
    }, []);

    const handleDownload = useCallback(() => {
        if (!pdfUrl) return;
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = pdfFilename;
        link.click();
    }, [pdfUrl, pdfFilename]);

    const closePdfOverlay = useCallback(() => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setPdfState("idle");
    }, [pdfUrl]);


    const {
        isHR,
        salaries,
        loading,
        userSearchTerm,
        setUserSearchTerm,
        userSearching,
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

    const pdfOverlay = pdfState !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300">
                {pdfState === "generating" && (
                    <>
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-gray-900">Generating Payslip</h3>
                            <p className="text-sm text-muted-foreground mt-1">Please wait while we prepare your PDF...</p>
                        </div>
                    </>
                )}
                {pdfState === "ready" && (
                    <>
                        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-gray-900">Payslip Ready!</h3>
                            <p className="text-sm text-muted-foreground mt-1">{pdfFilename}</p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" className="flex-1 gap-2" onClick={closePdfOverlay}>
                                <X className="h-4 w-4" /> Close
                            </Button>
                            <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => { handleDownload(); closePdfOverlay(); }}>
                                <Download className="h-4 w-4" /> Download
                            </Button>
                        </div>
                    </>
                )}
                {pdfState === "error" && (
                    <>
                        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                            <X className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-gray-900">Generation Failed</h3>
                            <p className="text-sm text-muted-foreground mt-1">Something went wrong. Please try again.</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2" onClick={closePdfOverlay}>
                            <X className="h-4 w-4" /> Close
                        </Button>
                    </>
                )}
            </div>
        </div>
    );

    if (!isHR) {
        return (
            <>
            {pdfOverlay}
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
                {/* Employee Header */}
                <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                                <Receipt className="h-7 w-7 text-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">My Payrolls</h1>
                                <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">View your salary slips and payment history</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Select value={filterYear || "all"} onValueChange={(val) => {
                                if (val === "all") { setFilterYear(''); setFilterMonth(''); } else { setFilterYear(val); }
                            }}>
                                <SelectTrigger className="w-32 bg-background/70 border-border/60">
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
                                <SelectTrigger className="w-36 bg-background/70 border-border/60">
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
                                                base: Number(p.salary?.base) || 0,
                                                hra: Number(p.salary?.hra) || 0,
                                                lta: Number(p.salary?.lta) || 0,
                                                bonus: p.bonus || [],
                                                deduction: p.deduction || [],
                                                createdAt: p.createdAt,
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
            </>
        );
    }

    return (
        <>
        {pdfOverlay}
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* HR Header */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <Receipt className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Payroll Processing</h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">Generate and review payroll information across the organization</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Employee List Section */}
                <Card className="shadow-sm border-border overflow-hidden gap-0 py-0">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <div className="flex items-center gap-2 pt-6">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Employees</CardTitle>
                        </div>
                        <CardDescription>Select an employee to generate their payroll</CardDescription>
                        <div className="mt-3 relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search employees..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-150 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-muted/20 sticky top-0">
                                    <TableRow>
                                        <TableHead className="font-semibold">Employee</TableHead>
                                        <TableHead className="text-right font-semibold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userSearching ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
                                                Searching...
                                            </TableCell>
                                        </TableRow>
                                    ) : userSearchTerm.trim().length > 0 && userSearchTerm.trim().length < 2 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                                Type at least 2 characters to search
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 && userSearchTerm.trim().length >= 2 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                                Search for an employee by name
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.map((user) => (
                                        <TableRow key={user._id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-foreground text-xs font-bold border border-border">
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleOpenModal(user)} variant="outline" className="gap-2">
                                                    <FileText size={14} /> Create Payroll
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {usersTotal > 0 && !userSearchTerm.trim() && (
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
                <Card className="shadow-sm border-border overflow-hidden gap-0 py-0">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <div className="flex items-center gap-2 pt-6">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Generated Payrolls</CardTitle>
                        </div>
                        <CardDescription>View and filter processed payrolls</CardDescription>
                        <div className="mt-3 flex gap-3">
                            <Select value={filterYear || "all"} onValueChange={(val) => {
                                if (val === "all") { setFilterYear(''); setFilterMonth(''); } else { setFilterYear(val); }
                            }}>
                                <SelectTrigger className="w-32">
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
                                <SelectTrigger className="w-36">
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
                                <TableHeader className="bg-muted/20 sticky top-0">
                                    <TableRow>
                                        <TableHead className="font-semibold">Employee</TableHead>
                                        <TableHead className="font-semibold">Period</TableHead>
                                        <TableHead className="text-right font-semibold">Net Salary</TableHead>
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
        </>
    );
};

export default Payroll;
