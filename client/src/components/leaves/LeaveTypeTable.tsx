import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface LeaveType {
    _id: string;
    name: string;
    code: string;
    length: "HALF" | "FULL";
    isPaid: boolean;
}

interface LeaveTypeTableProps {
    leaveTypes: LeaveType[];
    onEdit: (leaveType: LeaveType) => void;
}

export default function LeaveTypeTable({ leaveTypes, onEdit }: LeaveTypeTableProps) {
    if (!leaveTypes || leaveTypes.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No leave types found.</div>;
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">No.</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaveTypes.map((type, index) => (
                        <TableRow key={type._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{type.code}</TableCell>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{type.length}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={type.isPaid ? "default" : "secondary"}>
                                    {type.isPaid ? "Paid" : "Unpaid"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
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

