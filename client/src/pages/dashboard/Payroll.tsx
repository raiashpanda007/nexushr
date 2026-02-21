import { Search, FileText, CheckCircle2 } from 'lucide-react';
import Loader from '@/components/Loader';
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
    function GeneratePdf(data: { BaseSalary: number; HRA: number; LTA: number; Bonus: { reason: string; amount: number }[]; Deduction: { reason: string; amount: number }[] }) {
        const worker = new Worker(new URL("../workers/pdf.worker.ts", import.meta.url));

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
        handleOpenModal,
        handleModalSuccess,
        filteredUsers,
        filteredPayrolls,
        getUserName,
        calculateTotals
    } = usePayroll();

    if (loading) {
        return <Loader />;
    }

    if (!isHR) {
        return (
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <h1 className="text-2xl font-bold">My Payrolls</h1>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <div className="w-32">
                            <Select value={filterYear || "all"} onValueChange={(val) => {
                                if (val === "all") {
                                    setFilterYear('');
                                    setFilterMonth('');
                                } else {
                                    setFilterYear(val);
                                }
                            }}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-gray-400 italic">All Years</SelectItem>
                                    {[2024, 2025, 2026].map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-36">
                            <Select value={filterMonth || "all"} onValueChange={(val) => {
                                if (val === "all") setFilterMonth('');
                                else setFilterMonth(val);
                            }} disabled={!filterYear}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-gray-400 italic">All Months</SelectItem>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                {filteredPayrolls.length === 0 ? (
                    <p className="text-gray-500">No payrolls found matching your filters.</p>
                ) : (
                    <div className="space-y-4">
                        {filteredPayrolls.map(p => {
                            const pDate = new Date(p.createdAt);
                            const pYear = pDate.getFullYear();
                            const pMonth = (pDate.getMonth() + 1).toString().padStart(2, '0');
                            const { totalBonus, totalDeduction, baseSalary, netSalary } = calculateTotals(p);
                            return (
                                <Card key={p._id}>
                                    <CardContent className="p-6 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-xl mb-1">{pMonth} / {pYear}</h3>
                                            <div className="flex flex-wrap gap-2 text-sm mt-2">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">Base: ${baseSalary}</span>
                                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Bonuses: +${totalBonus}</span>
                                                <span className="bg-red-50 text-red-700 px-2 py-1 rounded">Deductions: -${totalDeduction}</span>
                                                <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded">Net: ${netSalary}</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle2 size={16} className="mr-1" /> Processed</Badge>
                                        <Button size="sm" className="shadow-sm" variant="outline" onClick={() => GeneratePdf({
                                            BaseSalary: baseSalary,
                                            HRA: p.salary.HRA,
                                            LTA: p.salary.LTA,
                                            Bonus: p.bonus,
                                            Deduction: p.deduction
                                        })}>
                                            <FileText size={16} className="mr-2" /> Print
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                                        disabled={page === Math.ceil(total / limit) || Math.ceil(total / limit) === 0}
                                    >
                                        Next
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold">Payroll Processing</h1>
                    <p className="text-gray-500 mt-1">Generate and review payroll information across the organization.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Employee List Section */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="rounded-t-xl border-b border-indigo-50">
                        <CardTitle className="text-lg ">Employees</CardTitle>
                        <CardDescription>Select an employee to generate their payroll</CardDescription>
                        <div className="mt-4">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="pl-10 bg-white"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/80 sticky top-0">
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-6 text-gray-500">No employees found.</TableCell>
                                        </TableRow>
                                    ) : filteredUsers.map((user) => (
                                        <TableRow key={user._id} className="hover:bg-indigo-50/30 transition-colors">
                                            <TableCell>
                                                <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleOpenModal(user)} className="shadow-sm" variant="outline">
                                                    <FileText size={16} className="mr-2" /> Create Payroll
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Payrolls List Section */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="rounded-t-xl border-b border-emerald-50">
                        <CardTitle className="text-lg ">Generated Payrolls</CardTitle>
                        <CardDescription>View and filter processed payrolls</CardDescription>
                        <div className="mt-4 flex gap-4">
                            <div className="w-32">
                                <Select value={filterYear || "all"} onValueChange={(val) => {
                                    if (val === "all") {
                                        setFilterYear('');
                                        setFilterMonth('');
                                    } else {
                                        setFilterYear(val);
                                    }
                                }}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-gray-400 italic">All Years</SelectItem>
                                        {[2024, 2025, 2026].map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-36">
                                <Select value={filterMonth || "all"} onValueChange={(val) => {
                                    if (val === "all") setFilterMonth('');
                                    else setFilterMonth(val);
                                }} disabled={!filterYear}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-gray-400 italic">All Months</SelectItem>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/80 sticky top-0">
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Net Salary</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayrolls.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-gray-500">No payrolls match your filters.</TableCell>
                                        </TableRow>
                                    ) : filteredPayrolls.map((p) => {
                                        const pDate = new Date(p.createdAt);
                                        const pYear = pDate.getFullYear();
                                        const pMonth = (pDate.getMonth() + 1).toString().padStart(2, '0');
                                        const { totalBonus, totalDeduction, baseSalary, netSalary } = calculateTotals(p);
                                        return (
                                            <TableRow key={p._id} className="hover:bg-emerald-50/30 transition-colors">
                                                <TableCell className="font-medium text-gray-900">
                                                    {getUserName(p.user)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-white">{pMonth}/{pYear}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="text-xs shadow-sm inline-flex items-center gap-2 px-2 py-1 rounded-md border border-gray-100 bg-white">
                                                            <span className="text-gray-600 font-medium">Base: ${baseSalary}</span>
                                                            <span className="text-green-600 font-medium">+{totalBonus}</span>
                                                            <span className="text-red-500 font-medium">-{totalDeduction}</span>
                                                        </div>
                                                        <div className="font-bold px-1">
                                                            ${netSalary}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
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
