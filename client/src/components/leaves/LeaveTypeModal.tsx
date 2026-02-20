import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApiCaller from "@/utils/ApiCaller";
import type { LeaveType } from "./LeaveTypeTable";

interface LeaveTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: LeaveType | null;
    onSuccess: () => void;
}

export default function LeaveTypeModal({ isOpen, onClose, initialData, onSuccess }: LeaveTypeModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        length: "FULL",
        isPaid: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                code: initialData.code || "",
                length: initialData.length || "FULL",
                isPaid: initialData.isPaid ?? true,
            });
        } else {
            setFormData({
                name: "",
                code: "",
                length: "FULL",
                isPaid: true,
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, length: value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, isPaid: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            name: formData.name,
            code: formData.code,
            length: formData.length,
            isPaid: formData.isPaid,
        };

        try {
            if (initialData) {
                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "leaves", "types", initialData._id],
                    body: payload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update leave type");
                }
            } else {
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "leaves", "types"],
                    body: payload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create leave type");
                }
            }
        } catch {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Sick Leave" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="code">Code</Label>
                        <Input id="code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. SL" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Leave Length</Label>
                        <Select value={formData.length} onValueChange={handleSelectChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL">Full Day</SelectItem>
                                <SelectItem value="HALF">Half Day</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isPaid"
                            checked={formData.isPaid}
                            onCheckedChange={handleCheckboxChange}
                        />
                        <Label htmlFor="isPaid">Paid Leave</Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save details"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

