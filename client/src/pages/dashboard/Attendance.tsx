import { Calendar, LogIn, LogOut, BarChart3, Search, Activity, Clock, Award, AlertTriangle } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Loader from '../../components/Loader';
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
        return <Loader />;
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
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-900 bg-white min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Attendance Workspace</h1>
                    <p className="text-gray-500 mt-1">Manage, punch, and analyze team working hours seamlessly</p>
                </div>
                {isHR && (
                    <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                        {(["Records", "Analytics"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-sm text-sm font-semibold transition duration-150 ${activeTab === tab ? "bg-white shadow-sm ring-1 ring-gray-900/5 text-black" : "text-gray-500 hover:text-black"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {activeTab === "Records" && (
                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="col-span-1 shadow-sm border-gray-200 h-fit rounded-xl">
                        <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                            <CardTitle className="text-lg">Today's Hub</CardTitle>
                            <CardDescription className="text-gray-500">{formatDateStr(new Date().toISOString())}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => handlePunch("IN")}
                                    disabled={!canPunchIn || actionLoading}
                                    className="w-full justify-start gap-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    <LogIn size={18} />
                                    Punch IN
                                </Button>
                                <Button
                                    onClick={() => handlePunch("OUT")}
                                    disabled={!canPunchOut || actionLoading}
                                    variant="outline"
                                    className="w-full justify-start gap-2 border-gray-300 text-black hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <LogOut size={18} />
                                    Punch OUT
                                </Button>
                            </div>

                            {lastPunch && (
                                <div className="text-sm font-medium text-center text-gray-500 mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                                    Last action: <span className="text-black font-bold uppercase">{lastPunch.type}</span> at {formatTime(lastPunch.time)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-3 shadow-sm border-gray-200 rounded-xl">
                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-100">
                            <div>
                                <CardTitle className="text-xl">Logs Explorer</CardTitle>
                            </div>
                            <div className="flex items-center space-x-3 mt-4 md:mt-0 w-full md:w-auto">
                                {isHR && (
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search by ID or Name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 border-gray-300 focus:ring-black focus:border-black"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2">
                                    <Calendar className="text-gray-400 h-4 w-4 mr-2" />
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
                                            className="h-7 px-2 text-gray-500 hover:text-black ml-1"
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
                                    <TableHeader className="bg-gray-50/80 uppercase text-xs tracking-wider">
                                        <TableRow>
                                            <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                            {isHR && <TableHead className="font-semibold text-gray-600">Employee Details</TableHead>}
                                            <TableHead className="font-semibold text-gray-600">First In</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Last Out</TableHead>
                                            <TableHead className="font-semibold text-gray-600 right-align text-right">Total Time</TableHead>
                                            {isHR && <TableHead className="font-semibold text-gray-600 text-center">Analyze</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAttendances.map((record) => {
                                            const firstIn = record.punches?.find(p => p.type === "IN");
                                            const lastOut = record.punches ? [...record.punches].reverse().find(p => p.type === "OUT") : null;

                                            return (
                                                <TableRow key={record._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="font-medium whitespace-nowrap text-gray-900 border-b border-gray-100">
                                                        {formatDateStr(record.date)}
                                                    </TableCell>
                                                    {isHR && (
                                                        <TableCell className="border-b border-gray-100">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-900">{record.user?.firstName} {record.user?.lastName}</span>
                                                                    {record.syncState === 'unsynced' && (
                                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 uppercase text-[10px] tracking-wider font-semibold">
                                                                            Unsynced
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-400">{record.user?._id.slice(-6).toUpperCase()} • {record.user?.deptId?.name || 'N/A'}</span>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="whitespace-nowrap border-b border-gray-100">
                                                        {firstIn ? <span className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{formatTime(firstIn.time)}</span> : '-'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap border-b border-gray-100">
                                                        {lastOut ? <span className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{formatTime(lastOut.time)}</span> : '-'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-medium border-b border-gray-100">
                                                        {formatDuration(record.totalMinutes)}
                                                    </TableCell>
                                                    {isHR && (
                                                        <TableCell className="text-center border-b border-gray-100">
                                                            <Button variant="ghost" size="sm" onClick={() => setSelectedEmpId(record.user._id)} className="w-8 h-8 p-0 rounded-full hover:bg-black hover:text-white transition">
                                                                <BarChart3 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                        {filteredAttendances.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={isHR ? 6 : 5} className="h-32 text-center text-gray-400">
                                                    No attendance records found. Try adjusting criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {total > 0 && (
                                    <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                        <div className="text-sm text-gray-500">
                                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
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
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages || totalPages === 0}
                                            >
                                                Next
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <div>
                            <h3 className="text-lg font-bold">Analytics Engine Config</h3>
                            <p className="text-sm text-gray-500">Refine dataset by target timeframe & segments.</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Time Range</label>
                                <Input
                                    type="month"
                                    value={analyticsMonthFilter}
                                    onChange={(e) => setAnalyticsMonthFilter(e.target.value)}
                                    className="bg-white border-gray-300 w-full md:w-48"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Target Line</label>
                                <Select value={analyticsDeptFilter} onValueChange={setAnalyticsDeptFilter}>
                                    <SelectTrigger className="w-full md:w-56 bg-white border-gray-300 font-medium h-9">
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
                            <Card className="border-gray-200 shadow-sm rounded-xl bg-gray-50 border-t-4 border-t-black">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Award className="h-5 w-5 fill-black text-black" />
                                        Leading Department
                                    </CardTitle>
                                    <CardDescription>Highest average daily working hours for {format(parseISO(analyticsMonthFilter + '-01'), 'MMMM yyyy')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black">{bestDepartment.name}</div>
                                    <div className="mt-2 text-sm text-gray-600 font-medium">Avg {bestDepartment.avgHours.toFixed(2)} Hrs / employee block</div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-gray-200 shadow-sm rounded-xl bg-gray-50">
                                <CardHeader className="pb-2"><CardTitle>No Top Dept Data</CardTitle></CardHeader>
                            </Card>
                        )}

                        {(worstDepartment && bestDepartment?._id !== worstDepartment?._id) ? (
                            <Card className="border-gray-200 shadow-sm rounded-xl bg-gray-50 border-t-4 border-t-gray-400">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <AlertTriangle className="h-5 w-5 text-gray-500" />
                                        Needs Review
                                    </CardTitle>
                                    <CardDescription>Lowest average daily working hours for {format(parseISO(analyticsMonthFilter + '-01'), 'MMMM yyyy')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black">{worstDepartment.name}</div>
                                    <div className="mt-2 text-sm text-gray-600 font-medium">Avg {worstDepartment.avgHours.toFixed(2)} Hrs / employee block</div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-gray-200 shadow-sm rounded-xl bg-gray-50">
                                <CardHeader className="pb-2"><CardTitle>No Low Dept Data</CardTitle></CardHeader>
                            </Card>
                        )}
                    </div>

                    {analyticsDeptFilter === "ALL" ? (
                        <Card className="border-gray-200 shadow-sm rounded-xl">
                            <CardHeader>
                                <CardTitle>Macro Comparative Analysis</CardTitle>
                                <CardDescription>Tracking performance across segments for the selected period.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {departmentStats.length > 0 ? (
                                    <div className="h-80 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={departmentStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontWeight: 500 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                                <Tooltip
                                                    cursor={{ fill: '#F3F4F6' }}
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontWeight: '500', color: '#000' }}
                                                />
                                                <Bar dataKey="avgHours" name="Average Hours" fill="#000000" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">No attendance data discovered for the selected month window.</div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Roster Insight</CardTitle>
                                        <CardDescription>Individuals contributing to the selected operating line.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-white">{employeesInSelectedDept.length} Count</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {employeesInSelectedDept.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee Name</TableHead>
                                                <TableHead>System ID</TableHead>
                                                <TableHead>Period Aggregation</TableHead>
                                                <TableHead className="text-right">Deep Dive</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employeesInSelectedDept.map(emp => (
                                                <TableRow key={emp._id}>
                                                    <TableCell className="font-semibold">{emp.firstName} {emp.lastName}</TableCell>
                                                    <TableCell className="text-gray-500 font-mono text-sm">{emp._id}</TableCell>
                                                    <TableCell>{formatDuration(emp.totalLoggedMinutes)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 shadow-sm"
                                                            onClick={() => setSelectedEmpId(emp._id)}
                                                        >
                                                            <BarChart3 className="h-4 w-4 mr-2" /> View Spec
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">No members accumulated records in this segment for the timeframe.</div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Individual Employee Modal */}
            <Dialog open={!!selectedEmpId} onOpenChange={(open) => !open && setSelectedEmpId(null)}>
                <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-[95vw] md:w-[90vw] h-[85vh] overflow-y-auto bg-white border-gray-200 rounded-xl pr-2 md:p-6 p-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 leading-none">
                            <Activity className="h-6 w-6" /> {selectedEmpName} Analytics
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-8 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Charts Wrapper */}
                            <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100 bg-gray-50/50">
                                <CardHeader className="pb-0">
                                    <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-4 w-4" /> Working Hours History</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div className="h-56">
                                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Daily Log</p>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartDaily}>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                                    <Tooltip cursor={{ fill: '#E5E7EB' }} contentStyle={{ border: 'none', borderRadius: '4px', background: '#000', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                                    <Bar dataKey="Hours" fill="#000000" radius={[2, 2, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-32">
                                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Weekly Trends</p>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartWeekly}>
                                                        <XAxis dataKey="name" hide />
                                                        <Tooltip cursor={{ fill: '#f0f0f0' }} />
                                                        <Bar dataKey="Hours" fill="#555" radius={[2, 2, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="h-32">
                                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Monthly Aggregation</p>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartMonthly}>
                                                        <XAxis dataKey="name" hide />
                                                        <Tooltip cursor={{ fill: '#f0f0f0' }} />
                                                        <Bar dataKey="Hours" fill="#222" radius={[2, 2, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="col-span-1 shadow-sm border-gray-100">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/80 rounded-t-xl pb-3">
                                    <CardTitle className="text-lg">Detailed Punches</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 p-0">
                                    <div className="h-[460px] overflow-y-auto w-full">
                                        <Table>
                                            <TableHeader className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10 w-full">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-xs text-gray-500">Date/Time</TableHead>
                                                    <TableHead className="font-semibold text-xs text-gray-500 text-center">Trigger</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedEmpRecords.flatMap(record =>
                                                    record.punches.map((p, i) => (
                                                        <TableRow key={`${record._id}-${i}`} className="hover:bg-gray-50 border-b border-gray-50">
                                                            <TableCell className="text-sm">
                                                                <span className="font-medium">{formatDateStr(record.date)}</span>
                                                                <div className="text-xs text-gray-500">{formatTime(p.time)}</div>
                                                            </TableCell>
                                                            <TableCell className="text-center w-24">
                                                                <span className={`px-2 py-1 text-xs font-bold rounded ${p.type === 'IN' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                                    {p.type}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ).reverse()}
                                                {selectedEmpRecords.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-center text-gray-400 py-6">No punches found</TableCell>
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
