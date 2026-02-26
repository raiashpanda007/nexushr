
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
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
import EmployeeAvatar from "./EmployeeAvatar";

interface EmployeeTableProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    startIndex?: number;
}

export default function EmployeeTable({ employees, onEdit, startIndex = 1 }: EmployeeTableProps) {
    const navigate = useNavigate();

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
            <CardHeader className="bg-muted/30 text-foreground py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/70 border border-border/50">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Employees</CardTitle>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {employees.length} employee{employees.length !== 1 ? "s" : ""} total
                            </p>
                        </div>
                    </div>
                    <div className=" flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-background/70 rounded-xl px-4 py-2.5 border border-border/50">
                            <Wifi className="h-4 w-4 text-muted-foreground" />
                            <div className="text-right">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Online</p>
                                <p className="text-lg font-bold text-foreground">{onlineCount}</p>
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
                                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Skills
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
                            const employeeId = employee._id || employee.id;
                            return (
                                <TableRow
                                    key={employeeId}
                                    className={cn(
                                        "transition-colors group cursor-pointer",
                                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                    )}
                                    onClick={() => {
                                        if (!employeeId) return;
                                        navigate(`/employee/${employeeId}`);
                                    }}
                                >
                                    <TableCell>
                                        <span className="text-xs font-mono text-muted-foreground bg-muted rounded-md px-2 py-1">
                                            {startIndex + index}
                                        </span>
                                    </TableCell>

                                    {/* Employee - Combined name + email */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <EmployeeAvatar
                                                firstName={employee.firstName}
                                                lastName={employee.lastName}
                                                profilePhoto={employee.profilePhoto}
                                            />
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
                                                className="bg-primary/10 text-primary border border-primary/20"
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
                                                            className="bg-secondary/50 text-secondary-foreground border border-border text-[11px] px-1.5"
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
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted text-foreground px-2.5 py-1 text-xs font-semibold border border-border">
                                                <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(employee);
                                                }}
                                                title="Edit Employee"
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
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
