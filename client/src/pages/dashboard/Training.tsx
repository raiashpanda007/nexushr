import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, GraduationCap, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import LessonTable from "@/components/training/LessonTable";
import CreateLessonModal from "@/components/training/CreateLessonModal";
import { useTraining } from "@/hooks/Training/useTraining";
import { useAppSelector } from "@/store/hooks";

export default function Training() {
    const {
        lessons,
        loading,
        page,
        setPage,
        total,
        limit,
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        handleCreateCourse,
        handleDeleteLesson,
        handleModalClose,
        handleSuccess,
    } = useTraining();

    const { userDetails } = useAppSelector((state) => state.userState);
    const isHR = userDetails?.role?.toUpperCase() === "HR";

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
                            <GraduationCap className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                Training Courses
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1 font-medium">
                                {isHR
                                    ? "Manage courses, lessons, and employee progress"
                                    : "Browse your enrolled courses and track progress"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses..."
                                className="h-11 pl-9 w-full sm:w-56 bg-background/70 border-border/60 rounded-xl shadow-inner"
                            />
                        </div>

                        {isHR && (
                            <Button
                                onClick={handleCreateCourse}
                                className="h-11 font-semibold gap-2 whitespace-nowrap rounded-xl px-5"
                            >
                                <Plus className="h-5 w-5" />
                                Create Course
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-base font-medium animate-pulse">Loading courses...</p>
                    </div>
                ) : (
                    <>
                        <LessonTable
                            lessons={lessons}
                            onDelete={handleDeleteLesson}
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
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

            {isHR && (
                <CreateLessonModal
                    isOpen={isCreateModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
