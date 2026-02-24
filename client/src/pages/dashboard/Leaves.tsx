import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LeaveTypeTable from "@/components/leaves/LeaveTypeTable";
import LeaveTypeModal from "@/components/leaves/LeaveTypeModal";
import LeaveBalancesTable from "@/components/leaves/LeaveBalancesTable";
import CreateLeaveBalanceModal from "@/components/leaves/CreateLeaveBalanceModal";
import EditLeaveBalanceModal from "@/components/leaves/EditLeaveBalanceModal";
import EmployeeLeaves from "@/pages/dashboard/EmployeeLeaves";
import LeaveRequestsTable from "@/components/leaves/LeaveRequestsTable";
import { useLeaves } from "@/hooks/Leaves/useLeaves";
import { TreePalm, Search, Plus, CalendarCheck, Users, FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function Leaves() {
    const {
        role,
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

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 sm:p-8 shadow-xl shadow-primary/20 border border-primary/10">
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
                    <div className="relative lg:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/60" />
                        <Input
                            placeholder="Search leave types or employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full pl-10 bg-black/10 border-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/30 rounded-xl shadow-inner transition-colors hover:bg-black/20"
                        />
                    </div>
                </div>
            </div>

            {/* Leave Types Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">Leave Types</h2>
                    </div>
                    <Button
                        onClick={handleAddLeaveType}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 gap-2 rounded-xl"
                    >
                        <Plus className="h-4 w-4" /> Add Leave Type
                    </Button>
                </div>
                <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
                    {leaveTypesLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-xl border">
                            <Loader2 className="h-7 w-7 animate-spin text-teal-500 mb-3" />
                            <p className="text-sm font-medium">Loading leave types...</p>
                        </div>
                    ) : (
                        <>
                            <LeaveTypeTable leaveTypes={filteredLeaveTypes} onEdit={handleEditLeaveType} />
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
            </div>

            {/* Employee Leave Balances Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">Employee Leave Balances</h2>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 gap-2 rounded-xl"
                    >
                        <Plus className="h-4 w-4" /> Create Leave Balance
                    </Button>
                </div>
                <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
                    {balancesLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-xl border">
                            <Loader2 className="h-7 w-7 animate-spin text-emerald-500 mb-3" />
                            <p className="text-sm font-medium">Loading leave balances...</p>
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
            </div>

            {/* Leave Requests Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mt-6">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold tracking-tight">Leave Requests</h2>
                </div>
                <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-primary/5 border border-border/40 overflow-hidden">
                    {requestsLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-xl border">
                            <Loader2 className="h-7 w-7 animate-spin text-blue-500 mb-3" />
                            <p className="text-sm font-medium">Loading leave requests...</p>
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
            </div>

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

