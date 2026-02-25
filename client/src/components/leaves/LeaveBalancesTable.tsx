import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Wallet,
    Edit2,
    UserCircle,
    Building2,
    CalendarDays,
    Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaveBalanceEntry {
    leaveTypeId: string;
    leaveTypeName: string;
    balance: number;
}

export interface UserLeaveBalance {
    balanceId: string;
    userId: string;
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
        return (
            <Card className=" w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Wallet className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No leave balances found</p>
                    <p className="text-sm mt-1">Configure leave balances for your employees.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-muted/30 text-foreground py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/70 border border-border/50">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Leave Balances</CardTitle>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {users.length} employee{users.length !== 1 ? "s" : ""} with balances
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-12 font-semibold">
                                <Hash className="h-3.5 w-3.5 text-slate-500" />
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <UserCircle className="h-3.5 w-3.5 text-primary" /> Employee
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-primary" /> Department
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> Leave Balances
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, idx) => (
                            <TableRow
                                key={user.userId}
                                className={cn(
                                    "transition-colors group",
                                    idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                                )}
                            >
                                <TableCell>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted rounded-md px-2 py-1">
                                        {idx + 1}
                                    </span>
                                </TableCell>

                                {/* Employee */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 shadow-sm">
                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Department */}
                                <TableCell>
                                    {user.department ? (
                                        <Badge
                                            variant="secondary"
                                            className="bg-primary/10 text-primary border border-primary/20"
                                        >
                                            {user.department}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-sm italic">—</span>
                                    )}
                                </TableCell>

                                {/* Leave Balances */}
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        {user.balances.length > 0 ? (
                                            user.balances.map((b) => (
                                                <Badge
                                                    key={b.leaveTypeId}
                                                    variant="secondary"
                                                    className="bg-secondary/50 text-secondary-foreground border border-border text-[11px] px-1.5 gap-1"
                                                >
                                                    {b.leaveTypeName}
                                                    <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                                                        {b.balance}
                                                    </span>
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm italic">No balances assigned</span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(user)}
                                            title="Edit Leave Balances"
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

