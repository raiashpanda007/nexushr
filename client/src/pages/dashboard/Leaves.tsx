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
        <div className="min-h-screen bg-linear-to-br from-teal-50/50 via-background to-emerald-50/30 p-6 space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-linear-to-r from-teal-600 via-emerald-600 to-green-600 p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
                            <TreePalm className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Leave Management</h1>
                            <p className="text-white/70 text-sm mt-0.5">Manage leave types and employee leave balances</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <Input
                            placeholder="Search leave types or employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-80 pl-9 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                        />
                    </div>
                </div>
            </div>

            {/* Leave Types Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-teal-600" />
                        <h2 className="text-lg font-semibold">Leave Types</h2>
                    </div>
                    <Button
                        onClick={handleAddLeaveType}
                        className="bg-linear-to-r from-teal-600 to-emerald-600 text-white hover:opacity-90 gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Leave Type
                    </Button>
                </div>
                <div className="rounded-xl overflow-hidden">
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold">Employee Leave Balances</h2>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-linear-to-r from-emerald-600 to-green-600 text-white hover:opacity-90 gap-2"
                    >
                        <Plus className="h-4 w-4" /> Create Leave Balance
                    </Button>
                </div>
                <div className="rounded-xl overflow-hidden">
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
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Leave Requests</h2>
                </div>
                <div className="rounded-xl overflow-hidden">
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

