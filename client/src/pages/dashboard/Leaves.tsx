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

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                    <p className="text-muted-foreground">
                        Manage leave types and employee leave balances.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search leave types or employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-80"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Leave Types</h2>
                    <Button onClick={handleAddLeaveType}>Add Leave Type</Button>
                </div>
                <div className="bg-white rounded-lg shadow">
                    {leaveTypesLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading leave types...</div>
                    ) : (
                        <>
                            <LeaveTypeTable leaveTypes={filteredLeaveTypes} onEdit={handleEditLeaveType} />
                            {leaveTypesTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Showing {(leaveTypesPage - 1) * 10 + 1} to {Math.min(leaveTypesPage * 10, leaveTypesTotal)} of {leaveTypesTotal}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLeaveTypesPage(p => Math.max(1, p - 1))}
                                            disabled={leaveTypesPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLeaveTypesPage(p => Math.min(Math.ceil(leaveTypesTotal / 10), p + 1))}
                                            disabled={leaveTypesPage === Math.ceil(leaveTypesTotal / 10) || Math.ceil(leaveTypesTotal / 10) === 0}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Employee Leave Balances</h2>
                    <Button onClick={() => setIsCreateModalOpen(true)}>Create Leave Balance</Button>
                </div>
                <div className="bg-white rounded-lg shadow">
                    {balancesLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading leave balances...</div>
                    ) : (
                        <>
                            <LeaveBalancesTable
                                users={filteredUserBalances}
                                onEdit={(user) => setSelectedUserForEdit(user)}
                            />
                            {balancesTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Showing {(balancesPage - 1) * 10 + 1} to {Math.min(balancesPage * 10, balancesTotal)} of {balancesTotal}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBalancesPage(p => Math.max(1, p - 1))}
                                            disabled={balancesPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBalancesPage(p => Math.min(Math.ceil(balancesTotal / 10), p + 1))}
                                            disabled={balancesPage === Math.ceil(balancesTotal / 10) || Math.ceil(balancesTotal / 10) === 0}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Leave Requests</h2>
                </div>
                <div className="bg-white rounded-lg shadow">
                    {requestsLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading leave requests...</div>
                    ) : (
                        <>
                            <LeaveRequestsTable
                                requests={filteredLeaveRequests}
                                onRefresh={() => fetchLeaveRequests(requestsPage)}
                            />
                            {requestsTotal > 0 && (
                                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Showing {(requestsPage - 1) * requestsLimit + 1} to {Math.min(requestsPage * requestsLimit, requestsTotal)} of {requestsTotal} requests
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                                            disabled={requestsPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRequestsPage(p => Math.min(Math.ceil(requestsTotal / requestsLimit), p + 1))}
                                            disabled={requestsPage === Math.ceil(requestsTotal / requestsLimit) || Math.ceil(requestsTotal / requestsLimit) === 0}
                                        >
                                            Next
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

