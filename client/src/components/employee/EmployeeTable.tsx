
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/types";

interface EmployeeTableProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
}

export default function EmployeeTable({ employees, onEdit }: EmployeeTableProps) {
    if (!employees || employees.length === 0) {
        return <div className="p-4 text-center">No employees found.</div>;
    }

    const getDepartmentName = (dept: string | { _id: string; name: string } | undefined) => {
        if (!dept) return 'N/A';
        if (typeof dept === 'string') return dept;
        return dept.name;
    };

    const getSkillsList = (skills: (string | { _id: string; name: string })[] | undefined) => {
        if (!skills || skills.length === 0) return 'None';
        return skills.map(s => (typeof s === 'string' ? s : s.name)).join(", ");
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee, index) => (
                        <TableRow key={employee._id || employee.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{getDepartmentName(employee.deptId)}</TableCell>
                            <TableCell>{getSkillsList(employee.skills)}</TableCell>
                            <TableCell>{employee.note || '-'}</TableCell>
                            <TableCell className={employee.online ? "text-green-500" : "text-red-500"}>{employee.online ? 'Online' : 'Offline'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => onEdit(employee)}>
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
