import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSkillModal } from "@/hooks/skills/useSkillModal";

interface Skill {
    _id: string;
    name: string;
    category: string;
}

interface SkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Skill | null;
    onSuccess: () => void;
}

export default function SkillModal({ isOpen, onClose, initialData, onSuccess }: SkillModalProps) {
    const { formData, loading, error, fieldErrors, handleChange, handleSubmit } = useSkillModal({ isOpen, onClose, initialData, onSuccess });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Skill" : "Add Skill"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Skill Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                        {fieldErrors.name && <p className="text-red-500 text-xs">{fieldErrors.name}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g. Technical, Soft Skill" />
                        {fieldErrors.category && <p className="text-red-500 text-xs">{fieldErrors.category}</p>}
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
