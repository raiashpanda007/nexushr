import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Edit2, Trash2, Hash, FileText, Users, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Role } from "@/types";

interface RoleTableProps {
    roles: Role[];
    onEdit: (role: Role) => void;
    onDelete: (id: string) => void;
}

export default function RoleTable({ roles, onEdit, onDelete }: RoleTableProps) {
    const navigate = useNavigate();

    if (!roles || roles.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Shield className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No roles found</p>
                    <p className="text-sm mt-1">Create a role to manage employee permissions.</p>
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
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Roles</CardTitle>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {roles.length} role{roles.length !== 1 ? "s" : ""} configured
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
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
                                        <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Name
                                    </span>
                                </TableHead>
                                <TableHead className="font-semibold">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Department
                                    </span>
                                </TableHead>
                                <TableHead className="font-semibold">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" /> Employees
                                    </span>
                                </TableHead>
                                <TableHead className="font-semibold">
                                    <span className="inline-flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Permissions
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role, index) => {
                                const deptName = typeof role.department === 'string'
                                    ? role.department
                                    : role.department?.name || "N/A";

                                const employeeCount = (role.users || []).length;
                                const permissionCount = (role.permissions || []).length;

                                return (
                                    <TableRow
                                        key={role._id}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/50"
                                        onClick={() => navigate(`/roles/${role._id}`)}
                                    >
                                        <TableCell className="text-muted-foreground text-sm font-medium">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 border border-primary/20">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium text-foreground">{role.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-background/60 border-border/60">
                                                {deptName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-blue-50/50 hover:bg-blue-50/70 text-blue-700 border-blue-200">
                                                {employeeCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-purple-50/50 hover:bg-purple-50/70 text-purple-700 border-purple-200">
                                                {permissionCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-muted/50 hover:text-foreground transition-colors"
                                                    onClick={() => onEdit(role)}
                                                    title="Edit role"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                    onClick={() => onDelete(role._id)}
                                                    title="Delete role"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
