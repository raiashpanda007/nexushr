
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Users,
    Edit2,
    Mail,
    Building2,
    Sparkles,
    StickyNote,
    Wifi,
    WifiOff,
    Hash,
    UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";

interface EmployeeTableProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    startIndex?: number;
}

export default function EmployeeTable({ employees, onEdit, startIndex = 1 }: EmployeeTableProps) {
    if (!employees || employees.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Users className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No employees found</p>
                    <p className="text-sm mt-1">Add employees to get started.</p>
                </CardContent>
            </Card>
        );
    }

    const getDepartmentName = (dept: string | { _id: string; name: string } | undefined) => {
        if (!dept) return null;
        if (typeof dept === 'string') return dept;
        return dept.name;
    };

    const getSkillsList = (skills: (string | { _id: string; name: string })[] | undefined) => {
        if (!skills || skills.length === 0) return [];
        return skills.map(s => (typeof s === 'string' ? s : s.name));
    };

    const onlineCount = employees.filter(e => e.online).length;

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-linear-to-r from-blue-600 via-cyan-600 to-teal-600 text-white pb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Employees</CardTitle>
                            <p className="text-white/70 text-sm mt-0.5">
                                {employees.length} employee{employees.length !== 1 ? "s" : ""} total
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                            <Wifi className="h-4 w-4 text-emerald-300" />
                            <div className="text-right">
                                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Online</p>
                                <p className="text-lg font-bold text-emerald-300">{onlineCount}</p>
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
                                <Hash className="h-3.5 w-3.5 text-slate-500" />
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <UserCircle className="h-3.5 w-3.5 text-blue-500" /> Employee
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-violet-500" /> Department
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Skills
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <StickyNote className="h-3.5 w-3.5 text-slate-500" /> Note
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee, index) => {
                            const deptName = getDepartmentName(employee.deptId);
                            const skills = getSkillsList(employee.skills);
                            return (
                                <TableRow
                                    key={employee._id || employee.id}
                                    className={cn(
                                        "transition-colors group",
                                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                    )}
                                >
                                    <TableCell>
                                        <span className="text-xs font-mono text-muted-foreground bg-muted rounded-md px-2 py-1">
                                            {startIndex + index}
                                        </span>
                                    </TableCell>

                                    {/* Employee - Combined name + email */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 text-white text-xs font-bold shrink-0 shadow-sm">
                                                {employee.firstName?.[0]}{employee.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {employee.firstName} {employee.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {employee.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Department */}
                                    <TableCell>
                                        {deptName ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
                                            >
                                                {deptName}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm italic">Unassigned</span>
                                        )}
                                    </TableCell>

                                    {/* Skills */}
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-50">
                                            {skills.length > 0 ? (
                                                <>
                                                    {skills.slice(0, 3).map((skill, i) => (
                                                        <Badge
                                                            key={i}
                                                            variant="secondary"
                                                            className="bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 text-[11px] px-1.5"
                                                        >
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {skills.length > 3 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-muted text-muted-foreground text-[11px] px-1.5"
                                                        >
                                                            +{skills.length - 3}
                                                        </Badge>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">None</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Note */}
                                    <TableCell>
                                        <p className="text-sm text-muted-foreground max-w-37.5 truncate">
                                            {employee.note || <span className="italic">—</span>}
                                        </p>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        {employee.online ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Online
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 px-2.5 py-1 text-xs font-medium border border-slate-200/60 dark:border-slate-700/40">
                                                <WifiOff className="h-3 w-3" />
                                                Offline
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(employee)}
                                                title="Edit Employee"
                                                className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
