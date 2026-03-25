import { useNavigate } from "react-router-dom";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Trash2, BookOpen, ChevronRight } from "lucide-react";
import type { Lesson } from "@/types/training";
import { useAppSelector } from "@/store/hooks";

interface LessonTableProps {
    lessons: Lesson[];
    onDelete: (id: string) => void;
    startIndex: number;
}

const STATUS_CONFIG = {
    not_started: { label: "Not Started", variant: "secondary" as const },
    in_progress: { label: "In Progress", variant: "default" as const },
    completed: { label: "Completed", variant: "outline" as const },
};

export default function LessonTable({ lessons, onDelete, startIndex }: LessonTableProps) {
    const navigate = useNavigate();
    const { userDetails } = useAppSelector((state) => state.userState);
    const isHR = userDetails?.role?.toUpperCase() === "HR";

    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/40" />
                <p className="text-base font-medium">No courses found</p>
                <p className="text-sm mt-1">
                    {isHR ? "Create your first course to get started." : "You are not enrolled in any courses yet."}
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-12 text-muted-foreground font-semibold">#</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Name</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Description</TableHead>
                    <TableHead className="text-center text-muted-foreground font-semibold">Chapters</TableHead>
                    {!isHR && (
                        <TableHead className="text-center text-muted-foreground font-semibold">Progress</TableHead>
                    )}
                    <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {lessons.map((lesson, idx) => {
                    const statusCfg = lesson.status ? STATUS_CONFIG[lesson.status] : null;
                    return (
                        <TableRow
                            key={lesson._id}
                            className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => navigate(`/training/${lesson._id}`)}
                        >
                            <TableCell className="text-muted-foreground text-sm font-medium">
                                {startIndex + idx}
                            </TableCell>
                            <TableCell>
                                <p className="font-semibold text-foreground leading-snug">{lesson.name}</p>
                            </TableCell>
                            <TableCell className="max-w-xs">
                                <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                    {lesson.chaptersCount ?? 0}
                                </span>
                            </TableCell>
                            {!isHR && statusCfg && (
                                <TableCell className="text-center">
                                    <Badge variant={statusCfg.variant} className="text-xs">
                                        {statusCfg.label}
                                    </Badge>
                                </TableCell>
                            )}
                            {!isHR && !statusCfg && (
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="text-xs">Not Started</Badge>
                                </TableCell>
                            )}
                            <TableCell className="text-right">
                                <div
                                    className="flex items-center justify-end gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isHR && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent onClick={(e) => e.stopPropagation()}>
                                                <DialogHeader>
                                                    <DialogTitle>Delete Course</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to delete "{lesson.name}"? This action cannot be undone.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <Button variant="destructive" onClick={() => onDelete(lesson._id)}>
                                                            Delete
                                                        </Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => navigate(`/training/${lesson._id}`)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
