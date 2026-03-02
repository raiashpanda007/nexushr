import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee } from "@/types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { CheckCircle2, ChevronLeft, ChevronRight, Clock, DollarSign, Download, FileText, Loader2, Mail, Minus, Receipt, X } from "lucide-react";
import EmployeeAvatar from "@/components/employee/EmployeeAvatar";
import { pdf } from "@react-pdf/renderer";
import { PayrollDocument } from "@/utils/PdfGenerator";
import type { PayrollDocumentProps } from "@/utils/PdfGenerator";
import { mapRawDoc, type LeaveRequest as EmployeeLeaveRequest } from "@/hooks/EmployeeLeaves/useEmployeeLeaves";

type TabKey = "attendance" | "salary" | "leaves" | "payrolls";

type Punch = { type: "IN" | "OUT"; time: string };
interface AttendanceRecord {
    _id: string;
    user: { _id: string; firstName: string; lastName: string; email: string; deptId?: { _id: string; name: string } };
    date: string;
    punches: Punch[];
    totalMinutes: number;
}

interface SalaryUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deptId?: { _id: string; name: string };
}
interface SalaryRecord {
    _id: string;
    userId: SalaryUser;
    base: number;
    hra: number;
    lta: number;
    createdAt: string;
}

interface PayrollItem {
    _id: string;
    user: any;
    salary: any;
    bonus: { reason: string; amount: number }[];
    deduction: { reason: string; amount: number }[];
    createdAt: string;
    month: number;
    year: number;
}



function formatDuration(minutes: number) {
    const m = Number(minutes) || 0;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
}

function formatTime(timeStr: string) {
    if (!timeStr) return "-";
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function calculatePayrollTotals(payroll: PayrollItem) {
    const totalBonus = (payroll.bonus || []).reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    const totalDeduction = (payroll.deduction || []).reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    let baseSalary = 0;
    if (payroll.salary && typeof payroll.salary === "object") {
        baseSalary = Number(payroll.salary.base || 0) + Number(payroll.salary.hra || 0) + Number(payroll.salary.lta || 0);
    }
    const netSalary = baseSalary + totalBonus - totalDeduction;
    return { totalBonus, totalDeduction, baseSalary, netSalary };
}

export default function EmployeeDetails() {
    const { id } = useParams();
    const employeeId = id ?? "";

    const { userDetails } = useSelector((state: RootState) => state.userState);
    const role = userDetails?.role?.toUpperCase();

    const [activeTab, setActiveTab] = useState<TabKey>("attendance");

    // ── Employee profile ────────────────────────────────────────────────────
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [employeeLoading, setEmployeeLoading] = useState(true);
    const [employeeError, setEmployeeError] = useState<string | null>(null);

    // ── Attendance tab state ────────────────────────────────────────────────
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [attendancePage, setAttendancePage] = useState(1);
    const [attendanceTotal, setAttendanceTotal] = useState(0);
    const attendanceLimit = 10;
    const [attendanceDate, setAttendanceDate] = useState<string>("");

    // ── Salary tab state ────────────────────────────────────────────────────
    const [salaryLoading, setSalaryLoading] = useState(false);
    const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
    const [salaryPage, setSalaryPage] = useState(1);
    const [salaryTotal, setSalaryTotal] = useState(0);
    const salaryLimit = 10;

    // ── Leaves tab state (read-only, filtered from HR views) ────────────────
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [leaveBalances, setLeaveBalances] = useState<ReturnType<typeof mapRawDoc>["balances"]>([]);
    const [leaveRequestsAll, setLeaveRequestsAll] = useState<EmployeeLeaveRequest[]>([]);
    const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
    const [leaveRequestsPage, setLeaveRequestsPage] = useState(1);
    const leaveRequestsLimit = 10;

    // ── Payroll tab state ────────────────────────────────────────────────────
    const [payrollLoading, setPayrollLoading] = useState(false);
    const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
    const [payrollPage, setPayrollPage] = useState(1);
    const [payrollTotal, setPayrollTotal] = useState(0);
    const payrollLimit = 10;
    const [filterYear, setFilterYear] = useState<string>("");
    const [filterMonth, setFilterMonth] = useState<string>("");

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

    // Only HR should access arbitrary employee details
    if (role !== "HR") {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        let ignore = false;

        async function fetchEmployee() {
            if (!employeeId) return;
            setEmployeeLoading(true);
            setEmployeeError(null);
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "user", "get-users", employeeId],
                });

                if (!result.ok) {
                    throw new Error(result.response?.message || "Failed to load employee");
                }

                const payload = result.response.data;
                const emp = payload?.data ? payload.data : payload;
                if (!ignore) setEmployee(emp);
            } catch (e: any) {
                if (!ignore) setEmployeeError(e?.message || "Failed to load employee");
            } finally {
                if (!ignore) setEmployeeLoading(false);
            }
        }

        fetchEmployee();
        return () => { ignore = true; };
    }, [employeeId]);

    useEffect(() => {
        let ignore = false;

        async function fetchAttendance() {
            if (!employeeId) return;
            setAttendanceLoading(true);
            try {
                const queryParams: Record<string, string> = {
                    userId: employeeId,
                    page: attendancePage.toString(),
                    limit: attendanceLimit.toString(),
                };
                if (attendanceDate) queryParams.date = attendanceDate;

                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "attendance"],
                    queryParams,
                });

                if (!result.ok) throw new Error(result.response?.message || "Failed to fetch attendance");

                const payload = result.response.data;
                const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
                const total = payload?.total ?? rows.length;

                if (!ignore) {
                    setAttendance(rows);
                    setAttendanceTotal(total);
                }
            } catch (e) {
                if (!ignore) {
                    setAttendance([]);
                    setAttendanceTotal(0);
                }
            } finally {
                if (!ignore) setAttendanceLoading(false);
            }
        }

        if (activeTab === "attendance") {
            fetchAttendance();
        }

        return () => { ignore = true; };
    }, [employeeId, activeTab, attendancePage, attendanceDate]);

    useEffect(() => {
        let ignore = false;

        async function fetchSalaries() {
            if (!employeeId) return;
            setSalaryLoading(true);
            try {
                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "salaries"],
                    queryParams: {
                        userId: employeeId,
                        page: salaryPage.toString(),
                        limit: salaryLimit.toString(),
                    },
                });

                if (!result.ok) throw new Error(result.response?.message || "Failed to fetch salaries");

                const payload = result.response.data;
                const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
                const total = payload?.total ?? rows.length;

                if (!ignore) {
                    setSalaries(rows);
                    setSalaryTotal(total);
                }
            } catch {
                if (!ignore) {
                    setSalaries([]);
                    setSalaryTotal(0);
                }
            } finally {
                if (!ignore) setSalaryLoading(false);
            }
        }

        if (activeTab === "salary") {
            fetchSalaries();
        }

        return () => { ignore = true; };
    }, [employeeId, activeTab, salaryPage]);

    useEffect(() => {
        let ignore = false;

        async function fetchLeaves() {
            if (!employeeId) return;

            setLeavesLoading(true);
            setLeaveRequestsLoading(true);
            try {
                const [balancesRes, requestsRes] = await Promise.all([
                    ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "leaves", "balances"],
                        queryParams: { limit: "all" },
                    }),
                    ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "leaves", "requests"],
                        queryParams: { limit: "all" },
                    }),
                ]);

                if (balancesRes.ok) {
                    const payload = balancesRes.response.data;
                    const docs = Array.isArray(payload) ? payload : payload?.data ?? [];
                    const match = docs.find((d: any) => d?.userDetails?._id === employeeId || d?.user === employeeId);
                    const mapped = match ? mapRawDoc(match) : null;
                    if (!ignore) setLeaveBalances(mapped?.balances ?? []);
                } else if (!ignore) {
                    setLeaveBalances([]);
                }

                if (requestsRes.ok) {
                    const payload = requestsRes.response.data;
                    const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
                    const filtered = rows
                        .filter((r: any) => r?.requestedBy?._id === employeeId || r?.requestedBy === employeeId)
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    if (!ignore) setLeaveRequestsAll(filtered);
                } else if (!ignore) {
                    setLeaveRequestsAll([]);
                }
            } finally {
                if (!ignore) {
                    setLeavesLoading(false);
                    setLeaveRequestsLoading(false);
                }
            }
        }

        if (activeTab === "leaves") {
            fetchLeaves();
        }

        return () => { ignore = true; };
    }, [employeeId, activeTab]);

    useEffect(() => {
        setPayrollPage(1);
    }, [filterYear, filterMonth]);

    useEffect(() => {
        let ignore = false;

        async function fetchPayrolls() {
            if (!employeeId) return;
            setPayrollLoading(true);
            try {
                const queryParams: Record<string, string> = {
                    page: payrollPage.toString(),
                    limit: payrollLimit.toString(),
                };
                if (filterYear) queryParams.year = filterYear;
                if (filterYear && filterMonth) queryParams.month = filterMonth;

                const result = await ApiCaller<null, any>({
                    requestType: "GET",
                    paths: ["api", "v1", "payroll", employeeId],
                    queryParams,
                });

                if (!result.ok) throw new Error(result.response?.message || "Failed to fetch payrolls");

                const payload = result.response.data;
                const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
                const total = payload?.total ?? rows.length;

                if (!ignore) {
                    setPayrolls(rows);
                    setPayrollTotal(total);
                }
            } catch {
                if (!ignore) {
                    setPayrolls([]);
                    setPayrollTotal(0);
                }
            } finally {
                if (!ignore) setPayrollLoading(false);
            }
        }

        if (activeTab === "payrolls") {
            fetchPayrolls();
        }

        return () => { ignore = true; };
    }, [employeeId, activeTab, payrollPage, filterYear, filterMonth]);

    const employeeName = useMemo(() => {
        const first = employee?.firstName ?? "";
        const last = employee?.lastName ?? "";
        return `${first} ${last}`.trim() || "Employee";
    }, [employee?.firstName, employee?.lastName]);

    const departmentName = useMemo(() => {
        const dept = employee?.deptId;
        if (!dept) return "Unassigned";
        if (typeof dept === "string") return dept;
        return dept.name;
    }, [employee?.deptId]);

    const skillNames = useMemo(() => {
        const skills = employee?.skills ?? [];
        return skills.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean);
    }, [employee?.skills]);

    const attendancePages = Math.ceil(attendanceTotal / attendanceLimit);
    const salaryPages = Math.ceil(salaryTotal / salaryLimit);
    const payrollPages = Math.ceil(payrollTotal / payrollLimit);

    const leaveRequestsPaged = useMemo(() => {
        const start = (leaveRequestsPage - 1) * leaveRequestsLimit;
        return leaveRequestsAll.slice(start, start + leaveRequestsLimit);
    }, [leaveRequestsAll, leaveRequestsPage]);
    const leaveRequestsPages = Math.ceil(leaveRequestsAll.length / leaveRequestsLimit);

    if (employeeLoading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Loading employee...</p>
                </div>
            </div>
        );
    }

    if (employeeError || !employee) {
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-8">
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Employee not found</CardTitle>
                        <CardDescription>{employeeError || "Invalid employee id."}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <>
            {pdfOverlay}
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
                {/* Page Header */}
                <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                        <div className="flex items-center gap-4">
                            <EmployeeAvatar
                                firstName={employee.firstName}
                                lastName={employee.lastName}
                                profilePhoto={employee.profilePhoto}
                                className="h-14 w-14"
                                textClassName="text-lg"
                            />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{employeeName}</h1>
                                <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">Employee workspace</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content layout: left employee sidebar + right tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Employee details sidebar */}
                    <Card className="lg:col-span-4 border-border/50 overflow-hidden h-fit">
                        <div className="h-1 bg-black" />
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-4">
                                <EmployeeAvatar
                                    firstName={employee.firstName}
                                    lastName={employee.lastName}
                                    profilePhoto={employee.profilePhoto}
                                    className="h-14 w-14 rounded-2xl"
                                    textClassName="text-lg"
                                />
                                <div className="min-w-0">
                                    <CardTitle className="text-xl truncate">{employeeName}</CardTitle>
                                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-1">
                                        <Mail className="h-3.5 w-3.5" /> {employee.email}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="border-border">Dept: {departmentName}</Badge>
                                <Badge variant="secondary" className="border-border">ID: {employee._id?.slice(-6).toUpperCase()}</Badge>
                                {employee.online ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Online</Badge>
                                ) : (
                                    <Badge variant="secondary" className="border-border text-muted-foreground">Offline</Badge>
                                )}
                            </div>

                            {skillNames.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {skillNames.map((s, idx) => (
                                            <Badge key={`${s}-${idx}`} variant="secondary" className="border-border/60">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {employee.note && (
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Note</p>
                                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-sm text-foreground/90">
                                        {employee.note}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs content */}
                    <div className="lg:col-span-8">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
                            <TabsList className="w-full sm:w-auto">
                                <TabsTrigger value="attendance" className="gap-1.5">
                                    <Clock className="h-4 w-4" /> Attendance
                                </TabsTrigger>
                                <TabsTrigger value="salary" className="gap-1.5">
                                    <DollarSign className="h-4 w-4" /> Salary
                                </TabsTrigger>
                                <TabsTrigger value="leaves" className="gap-1.5">
                                    <Receipt className="h-4 w-4" /> Leaves
                                </TabsTrigger>
                                <TabsTrigger value="payrolls" className="gap-1.5">
                                    <FileText className="h-4 w-4" /> Payrolls
                                </TabsTrigger>
                            </TabsList>

                            {/* Attendance Tab */}
                            <TabsContent value="attendance">
                                <Card className="shadow-sm border-border overflow-hidden gap-0 py-0 mt-4">
                                    <CardHeader className="bg-muted/30 border-b border-border">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <CardTitle className="text-lg">Attendance</CardTitle>
                                                <CardDescription>Daily punch records</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="date"
                                                    value={attendanceDate}
                                                    onChange={(e) => { setAttendancePage(1); setAttendanceDate(e.target.value); }}
                                                    className="w-44"
                                                />
                                                {attendanceDate && (
                                                    <Button variant="outline" size="sm" onClick={() => { setAttendancePage(1); setAttendanceDate(""); }}>
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {attendanceLoading ? (
                                            <div className="flex flex-col items-center justify-center py-18 text-muted-foreground w-full">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                                <p className="text-sm font-medium animate-pulse">Loading attendance...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader className="bg-muted/20">
                                                            <TableRow>
                                                                <TableHead className="font-semibold">Date</TableHead>
                                                                <TableHead className="font-semibold">First In</TableHead>
                                                                <TableHead className="font-semibold">Last Out</TableHead>
                                                                <TableHead className="font-semibold text-right">Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {attendance.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                                                        No attendance records found.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                attendance.map((r) => {
                                                                    const firstIn = r.punches?.find((p) => p.type === "IN");
                                                                    const lastOut = r.punches ? [...r.punches].reverse().find((p) => p.type === "OUT") : undefined;
                                                                    return (
                                                                        <TableRow key={r._id} className="hover:bg-muted/30 transition-colors">
                                                                            <TableCell className="font-medium whitespace-nowrap">{formatDate(r.date)}</TableCell>
                                                                            <TableCell className="whitespace-nowrap">{firstIn ? formatTime(firstIn.time) : "-"}</TableCell>
                                                                            <TableCell className="whitespace-nowrap">{lastOut ? formatTime(lastOut.time) : "-"}</TableCell>
                                                                            <TableCell className="whitespace-nowrap text-right">
                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground font-semibold text-sm">
                                                                                    <Clock className="h-3.5 w-3.5" /> {formatDuration(r.totalMinutes)}
                                                                                </span>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {attendanceTotal > 0 && (
                                                    <div className="p-4 flex justify-between items-center border-t border-border">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing <span className="font-semibold text-foreground">{(attendancePage - 1) * attendanceLimit + 1}</span> to{" "}
                                                            <span className="font-semibold text-foreground">{Math.min(attendancePage * attendanceLimit, attendanceTotal)}</span> of{" "}
                                                            <span className="font-semibold text-foreground">{attendanceTotal}</span>
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setAttendancePage((p) => Math.max(1, p - 1))}
                                                                disabled={attendancePage === 1}
                                                                className="gap-1"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" /> Previous
                                                            </Button>
                                                            <span className="text-sm font-medium text-muted-foreground px-2">
                                                                {attendancePage} / {attendancePages || 1}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setAttendancePage((p) => Math.min(attendancePages, p + 1))}
                                                                disabled={attendancePage === attendancePages || attendancePages === 0}
                                                                className="gap-1"
                                                            >
                                                                Next <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Salary Tab */}
                            <TabsContent value="salary">
                                <Card className="shadow-sm border-border overflow-hidden gap-0 py-0 mt-4">
                                    <CardHeader className="bg-muted/30 border-b border-border">
                                        <CardTitle className="text-lg">Salary</CardTitle>
                                        <CardDescription>Salary records for this employee</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {salaryLoading ? (
                                            <div className="flex flex-col items-center justify-center py-18 text-muted-foreground w-full">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                                <p className="text-sm font-medium animate-pulse">Loading salaries...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader className="bg-muted/20">
                                                            <TableRow>
                                                                <TableHead className="font-semibold">Created</TableHead>
                                                                <TableHead className="font-semibold text-right">Base</TableHead>
                                                                <TableHead className="font-semibold text-right">HRA</TableHead>
                                                                <TableHead className="font-semibold text-right">LTA</TableHead>
                                                                <TableHead className="font-semibold text-right">Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {salaries.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                                                        No salary records found.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                salaries.map((s) => {
                                                                    const total = Number(s.base || 0) + Number(s.hra || 0) + Number(s.lta || 0);
                                                                    return (
                                                                        <TableRow key={s._id} className="hover:bg-muted/30 transition-colors">
                                                                            <TableCell className="whitespace-nowrap">{formatDate(s.createdAt)}</TableCell>
                                                                            <TableCell className="text-right font-medium">${Number(s.base || 0).toLocaleString()}</TableCell>
                                                                            <TableCell className="text-right font-medium">${Number(s.hra || 0).toLocaleString()}</TableCell>
                                                                            <TableCell className="text-right font-medium">${Number(s.lta || 0).toLocaleString()}</TableCell>
                                                                            <TableCell className="text-right">
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-3 py-1 text-sm font-bold border border-border">
                                                                                    <DollarSign className="h-3.5 w-3.5" /> {total.toLocaleString()}
                                                                                </span>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {salaryTotal > 0 && (
                                                    <div className="p-4 flex justify-between items-center border-t border-border">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing <span className="font-semibold text-foreground">{(salaryPage - 1) * salaryLimit + 1}</span> to{" "}
                                                            <span className="font-semibold text-foreground">{Math.min(salaryPage * salaryLimit, salaryTotal)}</span> of{" "}
                                                            <span className="font-semibold text-foreground">{salaryTotal}</span>
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSalaryPage((p) => Math.max(1, p - 1))}
                                                                disabled={salaryPage === 1}
                                                                className="gap-1"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" /> Previous
                                                            </Button>
                                                            <span className="text-sm font-medium text-muted-foreground px-2">
                                                                {salaryPage} / {salaryPages || 1}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSalaryPage((p) => Math.min(salaryPages, p + 1))}
                                                                disabled={salaryPage === salaryPages || salaryPages === 0}
                                                                className="gap-1"
                                                            >
                                                                Next <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Leaves Tab */}
                            <TabsContent value="leaves">
                                <div className="space-y-4 mt-4">
                                    <Card className="border-border/50 overflow-hidden">
                                        <CardHeader className="bg-muted/30 border-b border-border">
                                            <CardTitle className="text-lg">Leave Balances</CardTitle>
                                            <CardDescription>Current balances for this employee</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {leavesLoading ? (
                                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground w-full">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                                    <p className="text-sm font-medium animate-pulse">Loading balances...</p>
                                                </div>
                                            ) : leaveBalances.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center justify-center text-center">
                                                    <Receipt className="w-10 h-10 mb-3 text-muted-foreground" />
                                                    <p className="font-medium text-muted-foreground">No leave balances found.</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {leaveBalances.map((b) => (
                                                        <Badge key={b.leaveTypeId} variant="secondary" className="border-border">
                                                            {b.leaveTypeName}: {b.balance}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/50 overflow-hidden">
                                        <CardHeader className="bg-muted/30 border-b border-border">
                                            <CardTitle className="text-lg">Leave Requests</CardTitle>
                                            <CardDescription>Request history for this employee</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {leaveRequestsLoading ? (
                                                <div className="flex flex-col items-center justify-center py-18 text-muted-foreground w-full">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                                    <p className="text-sm font-medium animate-pulse">Loading requests...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader className="bg-muted/20">
                                                                <TableRow>
                                                                    <TableHead className="font-semibold">Applied</TableHead>
                                                                    <TableHead className="font-semibold">Type</TableHead>
                                                                    <TableHead className="font-semibold">From</TableHead>
                                                                    <TableHead className="font-semibold">To</TableHead>
                                                                    <TableHead className="font-semibold text-right">Days</TableHead>
                                                                    <TableHead className="font-semibold">Status</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {leaveRequestsPaged.length === 0 ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                                                            No leave requests found.
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    leaveRequestsPaged.map((r) => {
                                                                        const typeName = typeof r.type === "object" && r.type ? r.type.name : String(r.type);
                                                                        return (
                                                                            <TableRow key={r._id} className="hover:bg-muted/30 transition-colors">
                                                                                <TableCell className="whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
                                                                                <TableCell className="font-medium">{typeName}</TableCell>
                                                                                <TableCell className="whitespace-nowrap">{formatDate(r.from)}</TableCell>
                                                                                <TableCell className="whitespace-nowrap">{formatDate(r.to)}</TableCell>
                                                                                <TableCell className="text-right font-semibold">{r.quantity}</TableCell>
                                                                                <TableCell>
                                                                                    <Badge variant="secondary" className="border-border">
                                                                                        {r.status}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>

                                                    {leaveRequestsAll.length > 0 && (
                                                        <div className="p-4 flex justify-between items-center border-t border-border">
                                                            <p className="text-sm text-muted-foreground">
                                                                Showing <span className="font-semibold text-foreground">{(leaveRequestsPage - 1) * leaveRequestsLimit + 1}</span> to{" "}
                                                                <span className="font-semibold text-foreground">{Math.min(leaveRequestsPage * leaveRequestsLimit, leaveRequestsAll.length)}</span> of{" "}
                                                                <span className="font-semibold text-foreground">{leaveRequestsAll.length}</span>
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setLeaveRequestsPage((p) => Math.max(1, p - 1))}
                                                                    disabled={leaveRequestsPage === 1}
                                                                    className="gap-1"
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" /> Previous
                                                                </Button>
                                                                <span className="text-sm font-medium text-muted-foreground px-2">
                                                                    {leaveRequestsPage} / {leaveRequestsPages || 1}
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setLeaveRequestsPage((p) => Math.min(leaveRequestsPages, p + 1))}
                                                                    disabled={leaveRequestsPage === leaveRequestsPages || leaveRequestsPages === 0}
                                                                    className="gap-1"
                                                                >
                                                                    Next <ChevronRight className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Payrolls Tab */}
                            <TabsContent value="payrolls">
                                <div className="space-y-4 mt-4">
                                    <Card className="border-border/50 overflow-hidden">
                                        <CardHeader className="bg-muted/30 border-b border-border">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div>
                                                    <CardTitle className="text-lg">Payrolls</CardTitle>
                                                    <CardDescription>Payslips for this employee</CardDescription>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Select value={filterYear || "all"} onValueChange={(val) => {
                                                        if (val === "all") { setFilterYear(""); setFilterMonth(""); } else { setFilterYear(val); }
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
                                                        if (val === "all") setFilterMonth(""); else setFilterMonth(val);
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
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {payrollLoading ? (
                                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground w-full">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                                    <p className="text-sm font-medium animate-pulse">Loading payrolls...</p>
                                                </div>
                                            ) : payrolls.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center justify-center text-center">
                                                    <Receipt className="w-10 h-10 mb-3 text-indigo-400" />
                                                    <p className="font-medium text-muted-foreground">No payrolls found matching your filters.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {payrolls.map((p) => {
                                                        const pYear = p.year.toString();
                                                        const pMonth = p.month
                                                        const { totalBonus, totalDeduction, baseSalary, netSalary } = calculatePayrollTotals(p);
                                                        return (
                                                            <Card key={p._id} className="border-border hover:shadow-md transition-shadow overflow-hidden">
                                                                <div className="h-1 bg-black" />
                                                                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-bold text-xl">{pMonth} / {pYear}</h3>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 text-sm mt-3">
                                                                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                                                                                <DollarSign className="h-3.5 w-3.5" /> Base: ${baseSalary.toFixed(2)}
                                                                            </span>
                                                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium">
                                                                                <DollarSign className="h-3.5 w-3.5" /> +${totalBonus.toFixed(2)}
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
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="gap-2 shadow-sm"
                                                                            onClick={() => GeneratePdf({
                                                                                employeeName,
                                                                                base: Number((p as any).salary?.base) || 0,
                                                                                hra: Number((p as any).salary?.hra) || 0,
                                                                                lta: Number((p as any).salary?.lta) || 0,
                                                                                bonus: (p as any).bonus || [],
                                                                                deduction: (p as any).deduction || [],
                                                                                createdAt: p.createdAt,
                                                                            })}
                                                                        >
                                                                            <FileText size={14} /> Print
                                                                        </Button>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {payrollTotal > 0 && (
                                                <div className="mt-4 flex justify-between items-center border-t border-border pt-4">
                                                    <p className="text-sm text-muted-foreground">
                                                        Showing <span className="font-semibold text-foreground">{(payrollPage - 1) * payrollLimit + 1}</span> to{" "}
                                                        <span className="font-semibold text-foreground">{Math.min(payrollPage * payrollLimit, payrollTotal)}</span> of{" "}
                                                        <span className="font-semibold text-foreground">{payrollTotal}</span>
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPayrollPage((p) => Math.max(1, p - 1))}
                                                            disabled={payrollPage === 1}
                                                            className="gap-1"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" /> Previous
                                                        </Button>
                                                        <span className="text-sm font-medium text-muted-foreground px-2">
                                                            {payrollPage} / {payrollPages || 1}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPayrollPage((p) => Math.min(payrollPages, p + 1))}
                                                            disabled={payrollPage === payrollPages || payrollPages === 0}
                                                            className="gap-1"
                                                        >
                                                            Next <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </>
    );
}
