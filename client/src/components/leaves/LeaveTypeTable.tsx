import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface LeaveType {
    _id: string;
    name: string;
    description?: string;
    defaultBalance?: number;
}

interface LeaveTypeTableProps {
    leaveTypes: LeaveType[];
    onEdit: (leaveType: LeaveType) => void;
}

export default function LeaveTypeTable({ leaveTypes, onEdit }: LeaveTypeTableProps) {
    if (!leaveTypes || leaveTypes.length === 0) {
        return <div className="p-4 text-center">No leave types found.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Default Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaveTypes.map((type, index) => (
                        <TableRow key={type._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{type.name}</TableCell>
                            <TableCell>{type.description || "-"}</TableCell>
                            <TableCell>{type.defaultBalance ?? "-"}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => onEdit(type)}>
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

