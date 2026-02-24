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
    BarChart3,
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

// Color palette for balance badges
const balanceColors = [
    { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200/60 dark:border-indigo-800", numBg: "bg-indigo-500" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200/60 dark:border-emerald-800", numBg: "bg-emerald-500" },
    { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200/60 dark:border-amber-800", numBg: "bg-amber-500" },
    { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200/60 dark:border-rose-800", numBg: "bg-rose-500" },
    { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200/60 dark:border-cyan-800", numBg: "bg-cyan-500" },
    { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200/60 dark:border-violet-800", numBg: "bg-violet-500" },
];

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
            <CardHeader className="bg-linear-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Leave Balances</CardTitle>
                            <p className="text-white/70 text-sm mt-0.5">
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
                                <Hash className="h-3.5 w-3.5 text-purple-500" />
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <UserCircle className="h-3.5 w-3.5 text-fuchsia-500" /> Employee
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-violet-500" /> Department
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-pink-500" /> Leave Balances
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
                                        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-purple-500 to-pink-600 text-white text-xs font-bold shrink-0 shadow-sm">
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
                                            className="bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
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
                                            user.balances.map((b, i) => {
                                                const color = balanceColors[i % balanceColors.length];
                                                return (
                                                    <span
                                                        key={b.leaveTypeId}
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                                                            color.bg, color.text, color.border
                                                        )}
                                                    >
                                                        {b.leaveTypeName}
                                                        <span className={cn(
                                                            "inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] font-bold",
                                                            color.numBg
                                                        )}>
                                                            {b.balance}
                                                        </span>
                                                    </span>
                                                );
                                            })
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
                                            className="h-8 w-8 rounded-lg hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50"
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

