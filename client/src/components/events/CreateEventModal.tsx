import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useCreateEventModal } from "@/hooks/events/useCreateEventModal";
import { X, Search, Loader2 } from "lucide-react";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EVENT_TYPES = [
    { value: "MEETING", label: "Meeting" },
    { value: "BIRTHDAY", label: "Birthday" },
    { value: "ANNIVERSARY", label: "Anniversary" },
    { value: "HOLIDAY", label: "Holiday" },
    { value: "OTHER", label: "Other" },
];

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
    const {
        formData,
        loading,
        error,
        fieldErrors,
        departmentList,
        deptLoading,
        empSearchQuery,
        empSearchResults,
        selectedEmployees,
        empSearchLoading,
        isEmpSearchOpen,
        setEmpSearchQuery,
        setIsEmpSearchOpen,
        handleChange,
        handleTypeChange,
        handleForAllChange,
        handleDepartmentToggle,
        handleAddEmployee,
        handleRemoveEmployee,
        handleSubmit,
    } = useCreateEventModal({ isOpen, onClose, onSuccess });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new event
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                    {error && (
                        <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded-md">
                            {error}
                        </p>
                    )}

                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Event Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter event name"
                            required
                        />
                        {fieldErrors.name && <p className="text-red-500 text-xs">{fieldErrors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter event description"
                            rows={3}
                            required
                        />
                        {fieldErrors.description && <p className="text-red-500 text-xs">{fieldErrors.description}</p>}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.date && <p className="text-red-500 text-xs">{fieldErrors.date}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                name="time"
                                type="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.time && <p className="text-red-500 text-xs">{fieldErrors.time}</p>}
                        </div>
                    </div>

                    {/* Type */}
                    <div className="grid gap-2">
                        <Label>Event Type</Label>
                        <Select value={formData.type} onValueChange={handleTypeChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                                {EVENT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.type && <p className="text-red-500 text-xs">{fieldErrors.type}</p>}
                    </div>

                    {/* For All */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="forAll"
                            checked={formData.forAll}
                            onCheckedChange={(checked) => handleForAllChange(checked === true)}
                        />
                        <Label htmlFor="forAll" className="text-sm font-normal cursor-pointer">
                            For all employees
                        </Label>
                    </div>

                    {/* Departments & Employees selection (when not forAll) */}
                    {!formData.forAll && (
                        <>
                            {/* Departments */}
                            <div className="grid gap-2">
                                <Label>Departments</Label>
                                {deptLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading departments...
                                    </div>
                                ) : (
                                    <div className="border rounded-lg p-3 max-h-[150px] overflow-y-auto space-y-2">
                                        {departmentList.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No departments found</p>
                                        ) : (
                                            departmentList.map((dept) => (
                                                <div key={dept._id} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`dept-${dept._id}`}
                                                        checked={formData.departments.includes(dept._id)}
                                                        onCheckedChange={() => handleDepartmentToggle(dept._id)}
                                                    />
                                                    <Label
                                                        htmlFor={`dept-${dept._id}`}
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        {dept.name}
                                                    </Label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Employees */}
                            <div className="grid gap-2">
                                <Label>Employees</Label>

                                {/* Selected employees */}
                                {selectedEmployees.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-1">
                                        {selectedEmployees.map((emp) => (
                                            <Badge
                                                key={emp._id}
                                                variant="secondary"
                                                className="gap-1 pr-1"
                                            >
                                                {emp.firstName} {emp.lastName}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEmployee(emp._id)}
                                                    className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Employee search */}
                                <Popover open={isEmpSearchOpen} onOpenChange={setIsEmpSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            className="justify-start gap-2 font-normal text-muted-foreground"
                                        >
                                            <Search className="h-4 w-4" />
                                            Search employees to add...
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search by name or email..."
                                                value={empSearchQuery}
                                                onValueChange={setEmpSearchQuery}
                                            />
                                            <CommandList>
                                                {empSearchLoading ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No employees found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {empSearchResults.map((emp) => (
                                                                <CommandItem
                                                                    key={emp._id}
                                                                    value={emp._id}
                                                                    onSelect={() => handleAddEmployee(emp)}
                                                                >
                                                                    <div>
                                                                        <p className="text-sm font-medium">
                                                                            {emp.firstName} {emp.lastName}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {emp.email}
                                                                        </p>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </>
                    )}

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                "Create Event"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
