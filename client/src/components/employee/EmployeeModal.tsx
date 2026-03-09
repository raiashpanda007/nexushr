import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";
import { useEmployeeModal } from "@/hooks/employee/useEmployeeModal";
import { useRef } from "react";

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
        fieldErrors,
        skillsOpen,
        setSkillsOpen,
        handleChange,
        handleDeptChange,
        toggleSkill,
        updateSkillAmount,
        handleSubmit,
        previewUrl,
        uploading,
        uploadError,
        handleFileSelect,
    } = useEmployeeModal({ isOpen, onClose, initialData, onSuccess });

    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Employee" : "Add Employee"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* Profile Photo Upload */}
                    <div className="grid gap-2">
                        <Label>Profile Photo {!initialData && <span className="text-red-500">*</span>}</Label>
                        <div className="flex items-center gap-4">
                            <div
                                className="relative h-20 w-20 rounded-full border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors flex items-center justify-center overflow-hidden bg-muted/30"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                ) : previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover rounded-full" />
                                ) : (
                                    <Camera className="h-6 w-6 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? "Uploading..." : previewUrl ? "Change Photo" : "Upload Photo"}
                                </Button>
                                <p className="text-xs text-muted-foreground">JPG, PNG, max 5MB</p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                                e.target.value = "";
                            }}
                        />
                        {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
                        {fieldErrors.profilePhoto && <p className="text-red-500 text-xs">{fieldErrors.profilePhoto}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                        {fieldErrors.firstName && <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                        {fieldErrors.lastName && <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        {fieldErrors.email && <p className="text-red-500 text-xs">{fieldErrors.email}</p>}
                    </div>
                    {!initialData && (
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                            {fieldErrors.password && <p className="text-red-500 text-xs">{fieldErrors.password}</p>}
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
                        {fieldErrors.deptId && <p className="text-red-500 text-xs">{fieldErrors.deptId}</p>}
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
                                            {selectedSkills.map((selectedSkill) => {
                                                const skill = skills.find(s => s._id === selectedSkill.skillId);
                                                return skill ? (
                                                    <span key={selectedSkill.skillId} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs">
                                                        {skill.name} ({selectedSkill.amount})
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
                                                            selectedSkills.some(selectedSkill => selectedSkill.skillId === skill._id) ? "opacity-100" : "opacity-0"
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
                        {selectedSkills.length > 0 && (
                            <div className="space-y-2">
                                {selectedSkills.map((selectedSkill) => {
                                    const skill = skills.find((s) => s._id === selectedSkill.skillId);
                                    if (!skill) return null;

                                    return (
                                        <div key={selectedSkill.skillId} className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground flex-1 truncate">{skill.name}</span>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={selectedSkill.amount}
                                                onChange={(e) => updateSkillAmount(selectedSkill.skillId, Number(e.target.value))}
                                                className="w-24"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea id="note" name="note" value={formData.note} onChange={handleChange} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || uploading}>
                            {uploading ? "Uploading photo..." : loading ? "Saving..." : "Save details"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
