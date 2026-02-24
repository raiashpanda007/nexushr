import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDepartmentModal } from "@/hooks/departments/useDepartmentModal";

interface Department {
    _id: string;
    name: string;
    description: string;
}

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Department | null;
    onSuccess: () => void;
}

export default function DepartmentModal({ isOpen, onClose, initialData, onSuccess }: DepartmentModalProps) {
    const { formData, loading, error, fieldErrors, handleChange, handleSubmit } = useDepartmentModal({ isOpen, onClose, initialData, onSuccess });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Department" : "Add Department"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Department Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                        {fieldErrors.name && <p className="text-red-500 text-xs">{fieldErrors.name}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
                        {fieldErrors.description && <p className="text-red-500 text-xs">{fieldErrors.description}</p>}
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
