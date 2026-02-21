import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeaveType } from "./LeaveTypeTable";
import { useLeaveTypeModal } from "@/hooks/leaves/useLeaveTypeModal";

interface LeaveTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: LeaveType | null;
    onSuccess: () => void;
}

export default function LeaveTypeModal({ isOpen, onClose, initialData, onSuccess }: LeaveTypeModalProps) {
    const {
        formData,
        loading,
        error,
        handleChange,
        handleSelectChange,
        handleCheckboxChange,
        handleSubmit
    } = useLeaveTypeModal({ isOpen, onClose, initialData, onSuccess });

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

