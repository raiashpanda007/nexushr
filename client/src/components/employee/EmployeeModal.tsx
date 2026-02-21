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
import type { Employee } from "@/types";
import { useEmployeeModal } from "@/hooks/employee/useEmployeeModal";

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Employee | null;
    onSuccess: () => void;
}

export default function EmployeeModal({ isOpen, onClose, initialData, onSuccess }: EmployeeModalProps) {
    const {
        formData,
        selectedSkills,
        departments,
        skills,
        loading,
        error,
        skillsOpen,
        setSkillsOpen,
        handleChange,
        handleDeptChange,
        toggleSkill,
        handleSubmit
    } = useEmployeeModal({ isOpen, onClose, initialData, onSuccess });

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
