import { Calendar, LogIn, LogOut, BarChart3, Search, Activity, Clock, Award, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Fingerprint } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAttendance } from '@/hooks/Attendance/useAttendance';

const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'hh:mm a');
};

const formatDateStr = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy');
};

const formatDuration = (minutes: number) => {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

const Attendance = () => {
    const {
        userDetails,
        isHR,
        attendances,
        loading,
        actionLoading,
        page,
        setPage,
        total,
        limit,
        filterDate,
        setFilterDate,
        searchTerm,
        setSearchTerm,
        analyticsDeptFilter,
        setAnalyticsDeptFilter,
        analyticsMonthFilter,
        setAnalyticsMonthFilter,
        activeTab,
        setActiveTab,
        selectedEmpId,
        setSelectedEmpId,
        availableDepartments,
        handlePunch,
        filteredAttendances,
        departmentStats,
        bestDepartment,
        worstDepartment,
        employeesInSelectedDept,
        selectedEmpRecords,
        chartDaily,
        chartWeekly,
        chartMonthly,
        selectedEmpName
    } = useAttendance();

    if (loading && attendances.length === 0) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-3 bg-background/50 p-6 rounded-2xl backdrop-blur-sm border border-border/40 shadow-xl shadow-primary/5">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Synchronizing records...</p>
                </div>
            </div>
        );
    }

    const today = new Date();
    const todaysAttendance = attendances.find(a => {
        if (!a.date) return false;
        const d = new Date(a.date);
        return !isNaN(d.getTime()) && isSameDay(d, today) && a.user?._id === userDetails?.id;
    });
    const lastPunch = todaysAttendance && todaysAttendance.punches?.length > 0
        ? todaysAttendance.punches[todaysAttendance.punches.length - 1]
        : null;

    const canPunchIn = !lastPunch || lastPunch.type === "OUT";
    const canPunchOut = lastPunch && lastPunch.type === "IN";

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                {/* Abstract background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <Fingerprint className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Attendance Workspace</h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">Manage, punch, and analyze team working hours</p>
                        </div>
                    </div>
                    {isHR && (
                        <div className="flex bg-muted/50 backdrop-blur-md p-1.5 rounded-xl border border-border/50 shadow-inner">
                            {(["Records", "Analytics"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {activeTab === "Records" && (
                <div className={`grid gap-6 ${isHR ? '' : 'lg:grid-cols-4'} animate-in slide-in-from-bottom-2 fade-in duration-500`}>
                    {/* Today's Hub — employees only */}
                    {!isHR && (
                        <Card className="col-span-1 shadow-xl shadow-primary/5 border-border/40 h-fit rounded-2xl overflow-hidden bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
                            <CardHeader className="bg-muted/30 border-b border-border/40 pb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Calendar className="h-4 w-4 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg font-semibold tracking-tight">Today's Hub</CardTitle>
                                </div>
                                <CardDescription>{formatDateStr(new Date().toISOString())}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={() => handlePunch("IN")}
                                        disabled={!canPunchIn || actionLoading}
                                        className="w-full h-12 justify-start gap-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all font-semibold rounded-xl"
                                    >
                                        <LogIn size={20} />
                                        Punch IN
                                    </Button>
                                    <Button
                                        onClick={() => handlePunch("OUT")}
                                        disabled={!canPunchOut || actionLoading}
                                        variant="outline"
                                        className="w-full h-12 justify-start gap-3 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all font-semibold rounded-xl hover:border-red-300"
                                    >
                                        <LogOut size={20} />
                                        Punch OUT
                                    </Button>
                                </div>

                                {lastPunch && (
                                    <div className={`text-sm font-medium text-center p-3.5 rounded-xl border shadow-sm ${lastPunch.type === 'IN' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-red-50/50 border-red-200 text-red-700'}`}>
                                        Last action: <span className="font-bold uppercase tracking-wide">{lastPunch.type}</span> at {formatTime(lastPunch.time)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Logs Explorer */}
                    <Card className={`${isHR ? 'col-span-1' : 'col-span-1 lg:col-span-3'} shadow-xl shadow-primary/5 border-border/40 rounded-2xl overflow-hidden bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40`}>
                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 bg-linear-to-r from-slate-50 to-teal-50/50 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-teal-600" />
                                <CardTitle className="text-xl">Logs Explorer</CardTitle>
                            </div>
                            <div className="flex items-center space-x-3 mt-4 md:mt-0 w-full md:w-auto">
                                {isHR && (
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-teal-400" />
                                        <Input
                                            placeholder="Search by ID or Name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 border-teal-200 focus-visible:ring-teal-300"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center bg-white border border-teal-200 rounded-lg px-2">
                                    <Calendar className="text-teal-400 h-4 w-4 mr-2" />
                                    <Input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="w-36 h-9 border-0 bg-transparent focus:ring-0 p-0 shadow-none text-sm"
                                    />
                                    {filterDate && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFilterDate('')}
                                            className="h-7 px-2 text-muted-foreground hover:text-foreground ml-1"
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-teal-50/60 uppercase text-xs tracking-wider">
                                        <TableRow>
                                            <TableHead className="font-semibold text-teal-700">Date</TableHead>
                                            {isHR && <TableHead className="font-semibold text-teal-700">Employee Details</TableHead>}
                                            <TableHead className="font-semibold text-teal-700">First In</TableHead>
                                            <TableHead className="font-semibold text-teal-700">Last Out</TableHead>
                                            <TableHead className="font-semibold text-teal-700 text-right">Total Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAttendances.map((record) => {
                                            const firstIn = record.punches?.find(p => p.type === "IN");
                                            const lastOut = record.punches ? [...record.punches].reverse().find(p => p.type === "OUT") : null;

                                            return (
                                                <TableRow key={record._id} className="hover:bg-teal-50/40 transition-colors">
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {formatDateStr(record.date)}
                                                    </TableCell>
                                                    {isHR && (
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-white text-xs font-bold">
                                                                    {record.user?.firstName?.[0]}{record.user?.lastName?.[0]}
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold">{record.user?.firstName} {record.user?.lastName}</span>
                                                                    <div className="text-xs text-muted-foreground">{record.user?._id.slice(-6).toUpperCase()} • {record.user?.deptId?.name || 'N/A'}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="whitespace-nowrap">
                                                        {firstIn ? <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-sm font-medium">{formatTime(firstIn.time)}</span> : <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {lastOut ? <span className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-sm font-medium">{formatTime(lastOut.time)}</span> : <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold text-sm">
                                                            <Clock className="h-3.5 w-3.5" /> {formatDuration(record.totalMinutes)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filteredAttendances.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={isHR ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                                    <Fingerprint className="h-8 w-8 mx-auto mb-2 text-teal-300" />
                                                    No attendance records found. Try adjusting criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {total > 0 && (
                                    <div className="p-4 flex justify-between items-center border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span> records
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="gap-1">
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <span className="text-sm font-medium text-muted-foreground px-2">{page} / {totalPages || 1}</span>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="gap-1">
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "Analytics" && isHR && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    {/* Filter Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-5 bg-linear-to-r from-slate-50 to-teal-50 border border-teal-200 rounded-xl">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-teal-600" /> Analytics Engine
                            </h3>
                            <p className="text-sm text-muted-foreground">Refine dataset by timeframe & segments</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider block">Time Range</label>
                                <Input
                                    type="month"
                                    value={analyticsMonthFilter}
                                    onChange={(e) => setAnalyticsMonthFilter(e.target.value)}
                                    className="border-teal-200 w-full md:w-48 focus-visible:ring-teal-300"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider block">Department</label>
                                <Select value={analyticsDeptFilter} onValueChange={setAnalyticsDeptFilter}>
                                    <SelectTrigger className="w-full md:w-56 border-teal-200 font-medium h-9">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Departments</SelectItem>
                                        {availableDepartments.map(dept => (
                                            <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bestDepartment ? (
                            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-linear-to-br from-emerald-50/50 to-teal-50/50 border-t-4 border-t-emerald-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Award className="h-5 w-5 text-emerald-500" />
                                        Leading Department
                                    </CardTitle>
                                    <CardDescription>Highest average hours for {format(parseISO(analyticsMonthFilter + '-01'), 'MMMM yyyy')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-emerald-700">{bestDepartment.name}</div>
                                    <div className="mt-2 text-sm text-emerald-600 font-medium">Avg {bestDepartment.avgHours.toFixed(2)} Hrs / employee</div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-border shadow-sm rounded-xl bg-slate-50">
                                <CardHeader className="pb-2"><CardTitle className="text-muted-foreground">No Top Dept Data</CardTitle></CardHeader>
                            </Card>
                        )}

                        {(worstDepartment && bestDepartment?._id !== worstDepartment?._id) ? (
                            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-linear-to-br from-amber-50/50 to-orange-50/50 border-t-4 border-t-amber-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        Needs Review
                                    </CardTitle>
                                    <CardDescription>Lowest average hours for {format(parseISO(analyticsMonthFilter + '-01'), 'MMMM yyyy')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-amber-700">{worstDepartment.name}</div>
                                    <div className="mt-2 text-sm text-amber-600 font-medium">Avg {worstDepartment.avgHours.toFixed(2)} Hrs / employee</div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-border shadow-sm rounded-xl bg-slate-50">
                                <CardHeader className="pb-2"><CardTitle className="text-muted-foreground">No Low Dept Data</CardTitle></CardHeader>
                            </Card>
                        )}
                    </div>

                    {analyticsDeptFilter === "ALL" ? (
                        <Card className="border-border shadow-sm rounded-xl overflow-hidden gap-0 py-0">
                            <CardHeader className="bg-muted/30 border-b border-border">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-muted-foreground" /> Department Comparison
                                </CardTitle>
                                <CardDescription>Tracking performance across departments for the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {departmentStats.length > 0 ? (
                                    <div className="h-80 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={departmentStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontWeight: 500 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                                                <Tooltip
                                                    cursor={{ fill: 'var(--muted)' }}
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontWeight: '500', color: 'var(--foreground)' }}
                                                />
                                                <Bar dataKey="avgHours" name="Average Hours" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                        No attendance data for the selected month.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border shadow-sm rounded-xl overflow-hidden gap-0 py-0">
                            <CardHeader className="bg-muted/30 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-muted-foreground" /> Department Roster
                                        </CardTitle>
                                        <CardDescription>Individual contributions in the selected department</CardDescription>
                                    </div>
                                    <Badge variant="secondary">{employeesInSelectedDept.length} Members</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {employeesInSelectedDept.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-muted/20">
                                            <TableRow>
                                                <TableHead className="font-semibold">Employee Name</TableHead>
                                                <TableHead className="font-semibold">System ID</TableHead>
                                                <TableHead className="font-semibold">Total Logged</TableHead>
                                                <TableHead className="text-right font-semibold">Deep Dive</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employeesInSelectedDept.map(emp => (
                                                <TableRow key={emp._id} className="hover:bg-muted/20 transition-colors">
                                                    <TableCell className="font-semibold">{emp.firstName} {emp.lastName}</TableCell>
                                                    <TableCell className="text-muted-foreground font-mono text-sm">{emp._id}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-foreground font-medium text-sm">
                                                            <Clock className="h-3.5 w-3.5" /> {formatDuration(emp.totalLoggedMinutes)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                                                            onClick={() => setSelectedEmpId(emp._id)}
                                                        >
                                                            <BarChart3 className="h-4 w-4" /> View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Activity className="h-8 w-8 mx-auto mb-2 text-teal-300" />
                                        No records for this department in the selected timeframe.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Individual Employee Modal */}
            <Dialog open={!!selectedEmpId} onOpenChange={(open) => !open && setSelectedEmpId(null)}>
                <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-[95vw] md:w-[90vw] h-[85vh] overflow-y-auto border-border rounded-xl pr-2 md:p-6 p-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 leading-none">
                            <Activity className="h-6 w-6 text-teal-600" /> {selectedEmpName} Analytics
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-8 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Charts */}
                            <Card className="col-span-1 lg:col-span-2 shadow-sm border-border bg-linear-to-br from-teal-50/30 to-cyan-50/30">
                                <CardHeader className="pb-0">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-teal-600" /> Working Hours History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div className="h-56">
                                            <p className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-widest">Daily Log</p>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartDaily}>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                                    <Tooltip cursor={{ fill: '#F0FDFA' }} contentStyle={{ border: '1px solid #99F6E4', borderRadius: '8px', background: '#fff' }} />
                                                    <Bar dataKey="Hours" fill="#0D9488" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-32">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Weekly Trends</p>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartWeekly}>
                                                        <XAxis dataKey="name" hide />
                                                        <Tooltip cursor={{ fill: 'var(--muted)' }} />
                                                        <Bar dataKey="Hours" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="h-32">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Monthly Aggregation</p>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartMonthly}>
                                                        <XAxis dataKey="name" hide />
                                                        <Tooltip cursor={{ fill: 'var(--muted)' }} />
                                                        <Bar dataKey="Hours" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Punches Detail */}
                            <Card className="col-span-1 shadow-sm border-border overflow-hidden gap-0 py-0">
                                <CardHeader className="border-b border-border bg-muted/30 rounded-t-xl pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Fingerprint className="h-4 w-4 text-muted-foreground" /> Detailed Punches
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 p-0">
                                    <div className="h-115 overflow-y-auto w-full">
                                        <Table>
                                            <TableHeader className="bg-white sticky top-0 border-b border-border shadow-sm z-10 w-full">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-xs">Date/Time</TableHead>
                                                    <TableHead className="font-semibold text-xs text-center">Type</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedEmpRecords.flatMap(record =>
                                                    record.punches.map((p, i) => (
                                                        <TableRow key={`${record._id}-${i}`} className="hover:bg-muted/20 border-b border-border/50">
                                                            <TableCell className="text-sm">
                                                                <span className="font-medium">{formatDateStr(record.date)}</span>
                                                                <div className="text-xs text-muted-foreground">{formatTime(p.time)}</div>
                                                            </TableCell>
                                                            <TableCell className="text-center w-24">
                                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${p.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {p.type}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ).reverse()}
                                                {selectedEmpRecords.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No punches found</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Attendance;
