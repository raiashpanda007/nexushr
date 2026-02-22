
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Skill {
    _id: string;
    name: string;
    category: string;
    syncState?: "unsynced" | "synced";
}

interface SkillTableProps {
    skills: Skill[];
    onEdit: (skill: Skill) => void;
    onDelete: (id: string) => void;
}

export default function SkillTable({ skills, onEdit, onDelete }: SkillTableProps) {
    if (!skills || skills.length === 0) {
        return <div className="p-4 text-center">No skills found.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {skills.map((skill, index) => (
                        <TableRow key={skill._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {skill.name}
                                    {skill.syncState === 'unsynced' && (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 uppercase text-[10px] tracking-wider font-semibold">
                                            Unsynced
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{skill.category}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => onEdit(skill)}>
                                    Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => onDelete(skill._id)}>
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
