
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Skill {
    _id: string;
    name: string;
    category: string;
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
                                {skill.name}
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
