
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Edit2, Trash2, Hash, Tag, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Skill {
    _id: string;
    name: string;
    category: string;
}

interface SkillTableProps {
    skills: Skill[];
    onEdit: (skill: Skill) => void;
    onDelete: (id: string) => void;
    startIndex?: number;
}

const categoryColors: Record<string, string> = {};
const colorPalette = [
    { bg: "bg-muted/40", text: "text-foreground", border: "border-border" },
    { bg: "bg-muted/30", text: "text-foreground", border: "border-border" },
    { bg: "bg-muted/20", text: "text-foreground", border: "border-border" },
];
let colorIndex = 0;

function getCategoryColor(cat: string) {
    if (!categoryColors[cat]) {
        categoryColors[cat] = JSON.stringify(colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
    }
    return JSON.parse(categoryColors[cat]) as typeof colorPalette[0];
}

export default function SkillTable({ skills, onEdit, onDelete, startIndex = 1 }: SkillTableProps) {
    if (!skills || skills.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Sparkles className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No skills found</p>
                    <p className="text-sm mt-1">Create skills to tag your employees.</p>
                </CardContent>
            </Card>
        );
    }

    const uniqueCategories = [...new Set(skills.map(s => s.category))];

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-muted/30 text-foreground py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/60 border border-border">
                            <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Skills</CardTitle>
                            <p className="text-muted-foreground text-sm mt-0.5">{skills.length} skill{skills.length !== 1 ? "s" : ""} across {uniqueCategories.length} categor{uniqueCategories.length !== 1 ? "ies" : "y"}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {uniqueCategories.slice(0, 4).map((cat) => (
                            <span key={cat} className="bg-background/60 text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full border border-border">
                                {cat}
                            </span>
                        ))}
                        {uniqueCategories.length > 4 && (
                            <span className="bg-background/60 text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full border border-border">
                                +{uniqueCategories.length - 4}
                            </span>
                        )}
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
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Skill Name
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5 text-muted-foreground" /> Category
                                </span>
                            </TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {skills.map((skill, index) => {
                            const catColor = getCategoryColor(skill.category);
                            return (
                                <TableRow
                                    key={skill._id}
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
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted border border-border text-foreground">
                                                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                            <span className="font-semibold text-sm">{skill.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn("border", catColor.bg, catColor.text, catColor.border)}
                                        >
                                            {skill.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(skill)}
                                                title="Edit Skill"
                                                className="h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(skill._id)}
                                                title="Delete Skill"
                                                className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
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
            </CardContent>
        </Card>
    );
}
