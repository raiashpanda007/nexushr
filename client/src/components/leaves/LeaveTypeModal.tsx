import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
        description: "",
        defaultBalance: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || "",
                defaultBalance: initialData.defaultBalance?.toString() ?? "",
            });
        } else {
            setFormData({
                name: "",
                description: "",
                defaultBalance: "",
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            name: formData.name,
            description: formData.description || undefined,
            defaultBalance: formData.defaultBalance ? Number(formData.defaultBalance) : undefined,
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
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="defaultBalance">Default Balance (days)</Label>
                        <Input
                            id="defaultBalance"
                            name="defaultBalance"
                            type="number"
                            min={0}
                            value={formData.defaultBalance}
                            onChange={handleChange}
                        />
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

