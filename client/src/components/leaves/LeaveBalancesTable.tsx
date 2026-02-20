import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";

export interface LeaveBalanceEntry {
    leaveTypeId: string;
    leaveTypeName: string;
    balance: number;
}

export interface UserLeaveBalance {
    userId: string; // specific Leave Balance Document ID
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    balances: LeaveBalanceEntry[];
}

interface LeaveBalancesTableProps {
    users: UserLeaveBalance[];
    onEdit: (user: UserLeaveBalance) => void;
}

export default function LeaveBalancesTable({ users, onEdit }: LeaveBalancesTableProps) {
    if (!users || users.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No leave balances found.</div>;
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Leave Balances</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user, idx) => (
                        <TableRow key={user.userId}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {user.department || "-"}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-2">
                                    {user.balances.length > 0 ? (
                                        user.balances.map((b) => (
                                            <Badge key={b.leaveTypeId} variant="secondary" className="font-normal">
                                                {b.leaveTypeName}: <span className="font-bold ml-1">{b.balance}</span>
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm italic">No balances assigned</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(user)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

