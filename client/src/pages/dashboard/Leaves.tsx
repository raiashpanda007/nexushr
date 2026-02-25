import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LeaveTypeTable from "@/components/leaves/LeaveTypeTable";
import LeaveTypeModal from "@/components/leaves/LeaveTypeModal";
import LeaveBalancesTable from "@/components/leaves/LeaveBalancesTable";
import CreateLeaveBalanceModal from "@/components/leaves/CreateLeaveBalanceModal";
import EditLeaveBalanceModal from "@/components/leaves/EditLeaveBalanceModal";
import EmployeeLeaves from "@/pages/dashboard/EmployeeLeaves";
import LeaveRequestsTable from "@/components/leaves/LeaveRequestsTable";
import { useLeaves } from "@/hooks/Leaves/useLeaves";
import type { LeaveTab } from "@/hooks/Leaves/useLeaves";
import { TreePalm, Search, Plus, CalendarDays, Wallet, FileText, ChevronLeft, ChevronRight, Loader2, Hourglass, CheckCircle2, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
export default function Leaves() {
    const {
        role,
        activeTab,
        setActiveTab,
        search,
        setSearch,
        leaveTypes,
        leaveTypesLoading,
        leaveTypesPage,
        setLeaveTypesPage,
        leaveTypesTotal,
        selectedLeaveType,
        isLeaveTypeModalOpen,
        userBalances,
        balancesLoading,
        balancesPage,
        setBalancesPage,
        balancesTotal,
        requestsLoading,
        requestsPage,
        setRequestsPage,
        requestsTotal,
        requestsLimit,
        leaveRequestCounts,
        departmentStatusFilter,
        setDepartmentStatusFilter,
        selectedDepartmentId,
        setSelectedDepartmentId,
        departmentStatsLoading,
        departmentStats,
        departmentUsersLoading,
        departmentUsers,
        departmentLeaveTypes,
        selectedUserForEdit,
        setSelectedUserForEdit,
        isCreateModalOpen,
        setIsCreateModalOpen,
        handleAddLeaveType,
        handleEditLeaveType,
        handleLeaveTypeModalClose,
        handleLeaveTypeSuccess,
        handleCreateBalanceSuccess,
        handleEditBalanceSuccess,
        filteredLeaveTypes,
        filteredUserBalances,
        filteredLeaveRequests,
        fetchLeaveRequests
    } = useLeaves();

    // Employee view — delegate to dedicated component
    if (role !== "HR") {
        return <EmployeeLeaves />;
    }

    const leaveTypesPages = Math.ceil(leaveTypesTotal / 10);
    const balancesPages = Math.ceil(balancesTotal / 10);
    const requestsPages = Math.ceil(requestsTotal / requestsLimit);

    const requestsPending = leaveRequestCounts?.pendingCount ?? 0;
    const requestsAccepted = leaveRequestCounts?.acceptedCount ?? 0;
    const requestsRejected = leaveRequestCounts?.rejectedCount ?? 0;

    const getLeaveTypeData = () => {
        const typeMap: Record<string, number> = {};
        if (selectedDepartmentId === "all") {
            departmentStats.forEach(dept => {
                dept.leaveTypes?.forEach(lt => {
                    typeMap[lt.type] = (typeMap[lt.type] || 0) + lt.count;
                });
            });
        } else {
            departmentLeaveTypes?.forEach(lt => {
                typeMap[lt.type] = (typeMap[lt.type] || 0) + lt.count;
            });
        }

        // Use a stable set of colors for pie chart
        const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#6366f1"];

        return Object.entries(typeMap)
            .filter(([_, count]) => count > 0)
            .map(([name, count], index) => ({
                name,
                value: count,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
    };

    const pieData = getLeaveTypeData();

    const departmentOptions = departmentStats
        .map((d) => ({ id: d.departmentId, name: d.department }))
        .filter((d) => d.id && d.name)
        .sort((a, b) => a.name.localeCompare(b.name));

    const barData = selectedDepartmentId === "all"
        ? departmentStats.map((d) => {
            const row: any = { label: d.department, fullName: d.department, total: d.totalLeaves };
            d.leaveTypes?.forEach(lt => { row[lt.type] = lt.count; });
            return row;
        })
        : departmentUsers.map((u) => {
            const shortName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName.charAt(0)}.` : (u.firstName || u.email.split('@')[0]);
            const row: any = {
                label: shortName,
                fullName: `${u.firstName} ${u.lastName}`.trim() || u.email,
                total: u.totalLeaves,
            };
            u.leaveTypes?.forEach(lt => { row[lt.type] = lt.count; });
            return row;
        });

    const allLeaveTypesInBarData = Array.from(
        new Set(
            selectedDepartmentId === "all"
                ? departmentStats.flatMap(d => (d.leaveTypes || []).map(lt => lt.type))
                : departmentUsers.flatMap(u => (u.leaveTypes || []).map(lt => lt.type))
        )
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-bold text-base mb-3 border-b border-border/50 pb-2 text-foreground">
                        {data.fullName || label}
                    </p>
                    <div className="flex flex-col gap-2.5">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-sm font-medium gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                    <span className="text-muted-foreground">{entry.name}</span>
                                </div>
                                <span className="font-bold text-foreground">{entry.value}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center text-sm font-bold pt-2 mt-1 border-t border-border/50 text-foreground">
                            <span>Total Leaves</span>
                            <span>{data.total}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="rounded-2xl relative overflow-hidden  bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 sm:p-8 shadow-xl shadow-primary/20 border border-primary/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner border border-white/20">
                            <TreePalm className="h-7 w-7 text-white drop-shadow-sm" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">Leave Management</h1>
                            <p className="text-primary-foreground/80 text-sm sm:text-base mt-1 font-medium">Manage leave types and employee leave balances</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative lg:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/60" />
                            <Input
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full pl-10 bg-black/10 border-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/30 rounded-xl shadow-inner transition-colors hover:bg-black/20"
                            />
                        </div>
                        {activeTab === "types" && (
                            <Button
                                onClick={handleAddLeaveType}
                                className="h-11 bg-white text-emerald-700 hover:bg-white/90 font-bold shadow-lg shadow-black/10 gap-2 whitespace-nowrap rounded-xl px-5 hover:scale-105 transition-all"
                            >
                                <Plus className="h-5 w-5" /> Add Leave Type
                            </Button>
                        )}
                        {activeTab === "balances" && (
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="h-11 bg-white text-emerald-700 hover:bg-white/90 font-bold shadow-lg shadow-black/10 gap-2 whitespace-nowrap rounded-xl px-5 hover:scale-105 transition-all"
                            >
                                <Plus className="h-5 w-5" /> Create Balance
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaveTab)}>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="types" className="gap-1.5">
                        <CalendarDays className="h-4 w-4" /> Leave Types
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="gap-1.5">
                        <Wallet className="h-4 w-4" /> Balances
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-1.5">
                        <FileText className="h-4 w-4" /> Requests
                    </TabsTrigger>
                </TabsList>

                {/* Leave Types Tab */}
                <TabsContent value="types">
                    <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
                        {leaveTypesLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                                <p className="text-base font-medium animate-pulse">Loading leave types...</p>
                            </div>
                        ) : (
                            <>
                                <LeaveTypeTable leaveTypes={filteredLeaveTypes} onEdit={handleEditLeaveType} startIndex={(leaveTypesPage - 1) * 10 + 1} />
                                {leaveTypesTotal > 0 && (
                                    <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-semibold text-foreground">{(leaveTypesPage - 1) * 10 + 1}</span> to <span className="font-semibold text-foreground">{Math.min(leaveTypesPage * 10, leaveTypesTotal)}</span> of <span className="font-semibold text-foreground">{leaveTypesTotal}</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setLeaveTypesPage(p => Math.max(1, p - 1))} disabled={leaveTypesPage === 1} className="gap-1">
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <span className="text-sm font-medium text-muted-foreground px-2">{leaveTypesPage} / {leaveTypesPages || 1}</span>
                                            <Button variant="outline" size="sm" onClick={() => setLeaveTypesPage(p => Math.min(leaveTypesPages, p + 1))} disabled={leaveTypesPage === leaveTypesPages || leaveTypesPages === 0} className="gap-1">
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* Leave Balances Tab */}
                <TabsContent value="balances">
                    <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
                        {balancesLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                                <p className="text-base font-medium animate-pulse">Loading leave balances...</p>
                            </div>
                        ) : (
                            <>
                                <LeaveBalancesTable
                                    users={filteredUserBalances}
                                    onEdit={(user) => setSelectedUserForEdit(user)}
                                />
                                {balancesTotal > 0 && (
                                    <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-semibold text-foreground">{(balancesPage - 1) * 10 + 1}</span> to <span className="font-semibold text-foreground">{Math.min(balancesPage * 10, balancesTotal)}</span> of <span className="font-semibold text-foreground">{balancesTotal}</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setBalancesPage(p => Math.max(1, p - 1))} disabled={balancesPage === 1} className="gap-1">
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <span className="text-sm font-medium text-muted-foreground px-2">{balancesPage} / {balancesPages || 1}</span>
                                            <Button variant="outline" size="sm" onClick={() => setBalancesPage(p => Math.min(balancesPages, p + 1))} disabled={balancesPage === balancesPages || balancesPages === 0} className="gap-1">
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* Leave Requests Tab */}
                <TabsContent value="requests" className="space-y-6">
                    {!requestsLoading && requestsTotal > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Cards */}
                            <div className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Hourglass className="h-24 w-24 text-amber-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <Hourglass className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <h3 className="font-semibold text-amber-600/80 dark:text-amber-400">Pending</h3>
                                </div>
                                <p className="text-4xl font-bold text-amber-600 dark:text-amber-500">{requestsPending}</p>
                            </div>
                            <div className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors border border-emerald-500/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CheckCircle2 className="h-24 w-24 text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <h3 className="font-semibold text-emerald-600/80 dark:text-emerald-400">Accepted</h3>
                                </div>
                                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-500">{requestsAccepted}</p>
                            </div>
                            <div className="bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <XCircle className="h-24 w-24 text-red-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                    <h3 className="font-semibold text-red-600/80 dark:text-red-400">Rejected</h3>
                                </div>
                                <p className="text-4xl font-bold text-red-600 dark:text-red-500">{requestsRejected}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
                        {requestsLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                                <p className="text-base font-medium animate-pulse">Loading leave requests...</p>
                            </div>
                        ) : (
                            <>
                                <LeaveRequestsTable
                                    requests={filteredLeaveRequests}
                                    onRefresh={() => fetchLeaveRequests(requestsPage)}
                                />
                                {requestsTotal > 0 && (
                                    <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-semibold text-foreground">{(requestsPage - 1) * requestsLimit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(requestsPage * requestsLimit, requestsTotal)}</span> of <span className="font-semibold text-foreground">{requestsTotal}</span> requests
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setRequestsPage(p => Math.max(1, p - 1))} disabled={requestsPage === 1} className="gap-1">
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <span className="text-sm font-medium text-muted-foreground px-2">{requestsPage} / {requestsPages || 1}</span>
                                            <Button variant="outline" size="sm" onClick={() => setRequestsPage(p => Math.min(requestsPages, p + 1))} disabled={requestsPage === requestsPages || requestsPages === 0} className="gap-1">
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {!requestsLoading && requestsTotal > 0 && (
                        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary/5 flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-700 mt-8 relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
                                <div>
                                    <h3 className="font-bold text-lg sm:text-xl opacity-90 uppercase tracking-[0.18em] text-foreground">Department-wise Leave Requests</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Filter by status and optionally drill down into a department.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                    <Select
                                        value={departmentStatusFilter}
                                        onValueChange={(v) => setDepartmentStatusFilter(v as "ALL" | "PENDING" | "ACCEPTED" | "REJECTED")}
                                    >
                                        <SelectTrigger className="w-full sm:w-44">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedDepartmentId} onValueChange={(v) => setSelectedDepartmentId(v)}>
                                        <SelectTrigger className="w-full sm:w-64">
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Departments</SelectItem>
                                            {departmentOptions.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="relative z-10">
                                {(selectedDepartmentId === "all" ? departmentStatsLoading : departmentUsersLoading) ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground w-full">
                                        <Loader2 className="h-9 w-9 animate-spin text-emerald-600 mb-3" />
                                        <p className="text-sm font-medium animate-pulse">Loading chart...</p>
                                    </div>
                                ) : barData.length > 0 ? (
                                    <div className="w-full h-[340px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                <XAxis
                                                    dataKey="label"
                                                    angle={-35}
                                                    textAnchor="end"
                                                    height={70}
                                                    interval="preserveStartEnd"
                                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                                    tickLine={{ stroke: "hsl(var(--border))" }}
                                                />
                                                <YAxis
                                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                                    tickLine={{ stroke: "hsl(var(--border))" }}
                                                />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} />
                                                {allLeaveTypesInBarData.map((type, index) => {
                                                    const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#6366f1"];
                                                    return (
                                                        <Bar
                                                            key={type}
                                                            dataKey={type}
                                                            name={type}
                                                            stackId="a"
                                                            fill={COLORS[index % COLORS.length]}
                                                            radius={[0, 0, 0, 0]}
                                                        />
                                                    );
                                                })}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-48 w-full flex items-center justify-center text-muted-foreground text-sm">
                                        No data to display
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!requestsLoading && requestsTotal > 0 && (
                        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-primary/5 flex flex-col items-center justify-center animate-in slide-in-from-bottom-6 duration-700 mt-8 relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                            <h3 className="font-bold text-xl sm:text-2xl w-full text-center mb-10 opacity-90 uppercase tracking-[0.2em] relative z-10 text-foreground">Leave Distribution Analysis</h3>
                            {pieData.length > 0 ? (
                                <div className="w-full max-w-3xl h-[350px] relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={110}
                                                outerRadius={150}
                                                paddingAngle={6}
                                                dataKey="value"
                                                stroke="none"
                                                cornerRadius={12}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.12))" }} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--background))",
                                                    borderRadius: "16px",
                                                    border: "1px solid hsl(var(--border))",
                                                    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
                                                    color: "hsl(var(--foreground))",
                                                    padding: "16px 24px",
                                                }}
                                                itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: "1.25rem", textTransform: "uppercase", letterSpacing: "1px" }}
                                                cursor={{ fill: "transparent" }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={60}
                                                iconType="circle"
                                                wrapperStyle={{
                                                    paddingTop: "30px",
                                                    fontSize: "1.1rem",
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 w-full flex items-center justify-center text-muted-foreground text-sm relative z-10">
                                    No data to display
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <LeaveTypeModal
                isOpen={isLeaveTypeModalOpen}
                onClose={handleLeaveTypeModalClose}
                initialData={selectedLeaveType}
                onSuccess={handleLeaveTypeSuccess}
            />

            <CreateLeaveBalanceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateBalanceSuccess}
                existingBalances={userBalances}
                leaveTypes={leaveTypes}
            />

            <EditLeaveBalanceModal
                isOpen={!!selectedUserForEdit}
                onClose={() => setSelectedUserForEdit(null)}
                onSuccess={handleEditBalanceSuccess}
                userBalance={selectedUserForEdit}
                allLeaveTypes={leaveTypes}
            />
        </div>
    );
}
