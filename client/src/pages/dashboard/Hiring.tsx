import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, BriefcaseBusiness, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import OpeningTable from "@/components/hiring/OpeningTable";
import CreateOpeningModal from "@/components/hiring/CreateOpeningModal";
import { useHiring } from "@/hooks/Hiring/useHiring";

const STATUS_OPTIONS = [
    { value: "OPEN", label: "Open" },
    { value: "CLOSED", label: "Closed" },
    { value: "PAUSED", label: "Paused" },
];

export default function Hiring() {
    const {
        openings,
        loading,
        page,
        setPage,
        total,
        limit,
        statusFilter,
        setStatusFilter,
        isCreateModalOpen,
        handleCreateOpening,
        handleDeleteOpening,
        handleModalClose,
        handleSuccess,
    } = useHiring();

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-sm border border-border/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-md shadow-inner border border-border/50">
                            <BriefcaseBusiness className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                Hiring
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                                Manage job openings and recruitment pipeline
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Status filter */}
                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(v) => {
                                setStatusFilter(v === "all" ? "" : v);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-11 w-full sm:w-40 bg-background/70 border-border/60 rounded-xl shadow-inner">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleCreateOpening}
                            className="h-11 font-semibold gap-2 whitespace-nowrap rounded-xl px-5"
                        >
                            <Plus className="h-5 w-5" />
                            New Opening
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-base font-medium animate-pulse">
                            Loading job openings...
                        </p>
                    </div>
                ) : (
                    <>
                        <OpeningTable
                            openings={openings}
                            onDelete={handleDeleteOpening}
                            startIndex={(page - 1) * limit + 1}
                        />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                <p className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    <span className="font-semibold text-foreground">
                                        {(page - 1) * limit + 1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-semibold text-foreground">
                                        {Math.min(page * limit, total)}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold text-foreground">{total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Previous
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground px-2">
                                        {page} / {totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={page === totalPages || totalPages === 0}
                                        className="gap-1"
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <CreateOpeningModal
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
