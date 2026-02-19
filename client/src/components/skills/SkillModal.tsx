
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ApiCaller from "@/utils/ApiCaller";

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
    const [formData, setFormData] = useState({
        name: "",
        category: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                category: initialData.category,
            });
        } else {
            setFormData({
                name: "",
                category: "",
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (initialData) {
                // Update
                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "skills", initialData._id],
                    body: formData,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update skill");
                }
            } else {
                // Create
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "skills"],
                    body: formData,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create skill");
                }
            }
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

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
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g. Technical, Soft Skill" />
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
