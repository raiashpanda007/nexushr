import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BriefcaseBusiness,
    Trash2,
    Hash,
    Building2,
    UserCircle2,
    ListChecks,
    Layers,
} from "lucide-react";
import type { Opening } from "@/types/hiring";
import { useNavigate } from "react-router-dom";

interface OpeningTableProps {
    openings: Opening[];
    onDelete: (id: string) => void;
    startIndex?: number;
}

const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    CLOSED:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    PAUSED:
        "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
};

function getDepartmentName(departmentId: Opening["departmentId"]): string {
    if (!departmentId) return "—";
    if (typeof departmentId === "object") return departmentId.name;
    return "—";
}

function getManagerName(mgr: Opening["HiringManager"]): string {
    if (!mgr) return "—";
    if (typeof mgr === "object")
        return `${mgr.firstName} ${mgr.lastName}`;
    return "—";
}

export default function OpeningTable({
    openings,
    onDelete,
    startIndex = 1,
}: OpeningTableProps) {
    const navigate = useNavigate();
    if (!openings || openings.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <BriefcaseBusiness className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No openings found</p>
                    <p className="text-sm mt-1">Create your first job opening to get started.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-muted/30 text-foreground py-5 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/60 border border-border">
                        <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Job Openings</CardTitle>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {openings.length} opening{openings.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-12 font-semibold">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <BriefcaseBusiness className="h-3.5 w-3.5 text-muted-foreground" />
                                    Title
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Department
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Hiring Manager
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                    Status
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                                    Rounds / Questions
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {openings.map((opening, idx) => (
                            <TableRow
                                key={opening._id}
                                className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                onClick={() => navigate(`/hiring/${opening._id}`)}
                            >
                                <TableCell className="text-muted-foreground text-sm font-mono">
                                    {startIndex + idx}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">
                                            {opening.title}
                                        </p>
                                        {opening.note && (
                                            <p className="text-xs text-muted-foreground truncate max-w-45 mt-0.5">
                                                {opening.note}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {getDepartmentName(opening.departmentId)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {getManagerName(opening.HiringManager)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs font-semibold border ${STATUS_STYLES[opening.Status] ?? ""}`}
                                    >
                                        {opening.Status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                                            {Array.isArray(opening.rounds) ? opening.rounds.length : 0} rounds
                                        </span>
                                        <span className="text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                                            {Array.isArray(opening.questions) ? opening.questions.length : 0} questions
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onDelete(opening._id); }}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete opening"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
