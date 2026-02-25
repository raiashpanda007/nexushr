
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Edit2, Trash2, Hash, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
    _id: string;
    name: string;
    description: string;
}

interface DepartmentTableProps {
    departments: Department[];
    onEdit: (department: Department) => void;
    onDelete: (id: string) => void;
}

// Rotating color palette for department icons
const deptColors = [
    "from-foreground/25 to-foreground/5",
    "from-foreground/20 to-foreground/5",
    "from-foreground/15 to-foreground/5",
    "from-foreground/10 to-foreground/5",
];

export default function DepartmentTable({ departments, onEdit, onDelete }: DepartmentTableProps) {
    if (!departments || departments.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Building2 className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No departments found</p>
                    <p className="text-sm mt-1">Create a department to organize your teams.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-muted/30 text-foreground py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/60 border border-border">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Departments</CardTitle>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {departments.length} department{departments.length !== 1 ? "s" : ""} configured
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
                                <span className="inline-flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Name
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Description
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.map((dept, index) => (
                            <TableRow
                                key={dept._id}
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
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br text-foreground text-xs font-bold shrink-0 border border-border",
                                            deptColors[index % deptColors.length]
                                        )}>
                                            {dept.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-sm">{dept.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-muted-foreground max-w-xs truncate">
                                        {dept.description || <span className="italic">No description</span>}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(dept)}
                                            title="Edit Department"
                                            className="h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(dept._id)}
                                            title="Delete Department"
                                            className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                        >
                                            <Trash2 className="h-4 w-4" />
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
