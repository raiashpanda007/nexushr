
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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

export default function DepartmentTable({ departments, onEdit, onDelete }: DepartmentTableProps) {
    if (!departments || departments.length === 0) {
        return <div className="p-4 text-center">No departments found.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {departments.map((dept, index) => (
                        <TableRow key={dept._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                {dept.name}
                            </TableCell>
                            <TableCell>{dept.description}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => onEdit(dept)}>
                                    Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => onDelete(dept._id)}>
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
