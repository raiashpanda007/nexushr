import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useCreateAssetModal } from "@/hooks/Assets/useCreateAssetModal";
import {
    Loader2,
    Upload,
    ChevronsUpDown,
    Check,
    UserCircle,
    Search,
} from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface CreateAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const STATUSES = [
    { value: "AVAILABLE", label: "Available" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "DISPOSED", label: "Disposed" },
];

export default function CreateAssetModal({ isOpen, onClose, onSuccess }: CreateAssetModalProps) {
    const {
        formData,
        loading,
        uploading,
        previewUrl,
        error,
        employeeSearchOpen,
        setEmployeeSearchOpen,
        searchQuery,
        searchResults,
        searching,
        selectedUser,
        handleChange,
        handleFileSelect,
        handleStatusChange,
        handleSelectOwner,
        handleClearOwner,
        handleSearchChange,
        handleSubmit,
    } = useCreateAssetModal({ isOpen, onClose, onSuccess });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAssigned = formData.status === "ASSIGNED";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-130 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Asset</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="grid gap-2">
                        <Label htmlFor="name">Asset Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. MacBook Pro 16" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Asset Photo</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                        />
                        {previewUrl ? (
                            <div className="relative group">
                                <img
                                    src={previewUrl}
                                    alt="Asset preview"
                                    className="h-32 w-full rounded-lg object-cover border border-border/50"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2 text-sm font-medium">Uploading...</span>
                                    </div>
                                )}
                                {!uploading && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Change
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                {uploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
                                ) : (
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                )}
                                <span className="text-sm text-muted-foreground">
                                    {uploading ? "Uploading..." : "Click to upload photo"}
                                </span>
                                <span className="text-xs text-muted-foreground/60 mt-0.5">Max 5MB</span>
                            </button>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" value={formData.description} onChange={handleChange} required placeholder="Brief description of the asset" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={handleStatusChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Owner - shown always, required only when ASSIGNED */}
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-1.5">
                            Assign Owner
                            {isAssigned && <span className="text-red-500 text-xs">*</span>}
                            {!isAssigned && <span className="text-muted-foreground text-xs">(optional)</span>}
                        </Label>
                        <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeSearchOpen}
                                    className={cn(
                                        "w-full justify-between font-normal h-11 rounded-lg border-2 transition-colors",
                                        selectedUser
                                            ? "border-primary/20 bg-primary/5"
                                            : "hover:border-primary/30"
                                    )}
                                >
                                    {selectedUser ? (
                                        <span className="flex items-center gap-2">
                                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                                {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                                            </span>
                                            <span className="truncate">
                                                {selectedUser.firstName} {selectedUser.lastName}
                                            </span>
                                            {selectedUser.deptId && (
                                                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                                                    {selectedUser.deptId.name}
                                                </Badge>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Search employee by name...</span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Type a name to search..."
                                        value={searchQuery}
                                        onValueChange={handleSearchChange}
                                    />
                                    <CommandList>
                                        {searching ? (
                                            <div className="flex items-center justify-center py-6 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                <span className="text-sm">Searching...</span>
                                            </div>
                                        ) : searchQuery.trim().length < 2 ? (
                                            <div className="flex flex-col items-center py-6 text-muted-foreground">
                                                <Search className="h-8 w-8 mb-2 opacity-40" />
                                                <span className="text-sm">Type at least 2 characters to search</span>
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <CommandEmpty>
                                                <div className="flex flex-col items-center py-4 text-muted-foreground">
                                                    <UserCircle className="h-8 w-8 mb-2 opacity-40" />
                                                    <span className="text-sm">No employee found</span>
                                                </div>
                                            </CommandEmpty>
                                        ) : (
                                            <CommandGroup>
                                                {searchResults.map((user) => (
                                                    <CommandItem
                                                        key={user._id}
                                                        value={user._id}
                                                        onSelect={() => handleSelectOwner(user)}
                                                        className="flex items-center gap-3 py-2.5"
                                                    >
                                                        <span className={cn(
                                                            "flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0",
                                                            formData.currentOwner === user._id
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </span>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium truncate">
                                                                {user.firstName} {user.lastName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4 text-primary shrink-0",
                                                                formData.currentOwner === user._id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedUser && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-fit text-xs text-muted-foreground h-auto py-1 px-2"
                                onClick={handleClearOwner}
                            >
                                Clear selection
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="purchaseDate">Purchase Date</Label>
                            <Input id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                            <Input id="purchasePrice" name="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} required placeholder="0" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="warrantyPeriod">Warranty Period</Label>
                        <Input id="warrantyPeriod" name="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} required placeholder="e.g. 2 Years" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input id="notes" name="notes" value={formData.notes} onChange={handleChange} required placeholder="Additional notes" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading || uploading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || uploading}>
                            {uploading ? "Uploading photo..." : loading ? "Creating..." : "Create Asset"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
