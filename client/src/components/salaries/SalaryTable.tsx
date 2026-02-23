
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deptId?: {
        _id: string;
        name: string;
    };
}

interface Salary {
    _id: string;
    userId: User;
    base: number;
    hra: number;
    lta: number;
    createdAt: string;
}

interface SalaryTableProps {
    salaries: Salary[];
    isHR: boolean;
    onEdit: (salary: Salary) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
}

const SalaryTable: React.FC<SalaryTableProps> = ({ salaries, isHR, onEdit, onDelete, loading }) => {
    if (salaries.length === 0) {
        return (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center p-6 text-gray-500">
                    <p>No current salaries available.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Employee Salaries</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Base Salary</TableHead>
                            <TableHead className="text-right">HRA</TableHead>
                            <TableHead className="text-right">LTA</TableHead>
                            <TableHead className="text-right">Total Salary</TableHead>
                            {isHR && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salaries.map((salary) => (
                            <TableRow key={salary._id}>
                                <TableCell className="font-medium">
                                    {salary.userId?.firstName} {salary.userId?.lastName}
                                </TableCell>
                                <TableCell>{salary.userId?.email}</TableCell>
                                <TableCell>
                                    {salary.userId?.deptId ? (
                                        <Badge variant="outline">{salary.userId.deptId.name}</Badge>
                                    ) : (
                                        <span className="text-gray-400 text-sm">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">${salary.base.toLocaleString()}</TableCell>
                                <TableCell className="text-right">${salary.hra.toLocaleString()}</TableCell>
                                <TableCell className="text-right">${salary.lta.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                    ${(salary.base + salary.hra + salary.lta).toLocaleString()}
                                </TableCell>
                                {isHR && (
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(salary)}
                                                title="Edit Salary"
                                                disabled={loading}
                                            >
                                                <Edit2 className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(salary._id)}
                                                title="Delete Salary"
                                                disabled={loading}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default SalaryTable;
