
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ApiCaller from "@/utils/ApiCaller";
import type { Employee, Department, Skill } from "@/types";

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Employee | null;
    onSuccess: () => void;
}

export default function EmployeeModal({ isOpen, onClose, initialData, onSuccess }: EmployeeModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        deptId: "",
        note: "",
    });
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    // Data for selects
    const [departments, setDepartments] = useState<Department[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [skillsOpen, setSkillsOpen] = useState(false);

    // Fetch Departments and Skills
    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [deptRes, skillRes] = await Promise.all([
                    ApiCaller<null, Department[]>({ requestType: "GET", paths: ["api", "v1", "departments"] }),
                    ApiCaller<null, Skill[]>({ requestType: "GET", paths: ["api", "v1", "skills"] })
                ]);

                if (deptRes.ok) {
                    setDepartments(deptRes.response.data || []);
                }
                if (skillRes.ok) {
                    setSkills(skillRes.response.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch form data", err);
            } finally {
                setLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            const deptId = typeof initialData.deptId === 'object' ? initialData.deptId?._id : initialData.deptId;

            let initialSkills: string[] = [];
            if (initialData.skills && Array.isArray(initialData.skills)) {
                initialSkills = initialData.skills.map(s => typeof s === 'object' ? s._id : s);
            }

            setFormData({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                email: initialData.email,
                password: "",
                deptId: deptId || "",
                note: initialData.note || "",
            });
            setSelectedSkills(initialSkills);
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                deptId: "",
                note: "",
            });
            setSelectedSkills([]);
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeptChange = (value: string) => {
        setFormData(prev => ({ ...prev, deptId: value }));
    };

    const toggleSkill = (skillId: string) => {
        setSelectedSkills(prev =>
            prev.includes(skillId)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                skills: selectedSkills,
            };

            if (initialData) {
                // Update
                const { password, ...updatePayload } = payload;
                const userId = initialData._id || initialData.id || "";

                const result = await ApiCaller({
                    requestType: "PUT",
                    paths: ["api", "v1", "user", "update-employee", userId],
                    body: updatePayload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to update employee");
                }
            } else {
                // Create
                const result = await ApiCaller({
                    requestType: "POST",
                    paths: ["api", "v1", "user", "create-employee"],
                    body: payload,
                });

                if (result.ok) {
                    onSuccess();
                    onClose();
                } else {
                    setError(result.response.message || "Failed to create employee");
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
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Employee" : "Add Employee"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    {!initialData && (
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="deptId">Department</Label>
                        <Select onValueChange={handleDeptChange} value={formData.deptId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Skills</Label>
                        <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={skillsOpen}
                                    className="justify-between h-auto min-h-[40px]"
                                >
                                    {selectedSkills.length > 0
                                        ? <div className="flex flex-wrap gap-1">
                                            {selectedSkills.map(id => {
                                                const skill = skills.find(s => s._id === id);
                                                return skill ? (
                                                    <span key={id} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs">
                                                        {skill.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                        : "Select skills..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search skills..." />
                                    <CommandList>
                                        <CommandEmpty>No skill found.</CommandEmpty>
                                        <CommandGroup>
                                            {skills.map((skill) => (
                                                <CommandItem
                                                    key={skill._id}
                                                    value={skill.name} // Search by name
                                                    onSelect={() => toggleSkill(skill._id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedSkills.includes(skill._id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {skill.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea id="note" name="note" value={formData.note} onChange={handleChange} />
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
