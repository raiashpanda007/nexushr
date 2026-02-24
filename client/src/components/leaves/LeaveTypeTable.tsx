import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Edit2, Hash, Code2, Type, Clock, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaveType {
    _id: string;
    name: string;
    code: string;
    length: "HALF" | "FULL";
    isPaid: boolean;
}

interface LeaveTypeTableProps {
    leaveTypes: LeaveType[];
    onEdit: (leaveType: LeaveType) => void;
}

export default function LeaveTypeTable({ leaveTypes, onEdit }: LeaveTypeTableProps) {
    if (!leaveTypes || leaveTypes.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <CalendarDays className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No leave types found</p>
                    <p className="text-sm mt-1">Create leave types to manage employee time-off.</p>
                </CardContent>
            </Card>
        );
    }

    const paidCount = leaveTypes.filter(t => t.isPaid).length;

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-linear-to-r from-teal-600 via-emerald-600 to-green-600 text-white pm-5">
                <div className="flex items-center justify-between py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Leave Types</CardTitle>
                            <p className="text-white/70 text-sm mt-0.5">
                                {leaveTypes.length} type{leaveTypes.length !== 1 ? "s" : ""} configured
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                            <CircleDollarSign className="h-4 w-4 text-emerald-200" />
                            <div className="text-right">
                                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Paid</p>
                                <p className="text-lg font-bold text-emerald-200">{paidCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-12 font-semibold">
                                <Hash className="h-3.5 w-3.5 text-emerald-500" />
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Code2 className="h-3.5 w-3.5 text-teal-500" /> Code
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Type className="h-3.5 w-3.5 text-emerald-500" /> Name
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" /> Duration
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <CircleDollarSign className="h-3.5 w-3.5 text-green-500" /> Status
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaveTypes.map((type, index) => (
                            <TableRow
                                key={type._id}
                                className={cn(
                                    "transition-colors group",
                                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                )}
                            >
                                <TableCell>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted rounded-md px-2 py-1">
                                        {index + 1}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700">
                                        {type.code}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-linear-to-br from-teal-400 to-emerald-500 text-white shadow-sm">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="font-semibold text-sm">{type.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "border",
                                            type.length === "FULL"
                                                ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                                : "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
                                        )}
                                    >
                                        {type.length === "FULL" ? "Full Day" : "Half Day"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {type.isPaid ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                                            <CircleDollarSign className="h-3 w-3" />
                                            Paid
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 px-2.5 py-1 text-xs font-medium border border-slate-200/60 dark:border-slate-700/40">
                                            Unpaid
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(type)}
                                            title="Edit Leave Type"
                                            className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50"
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

