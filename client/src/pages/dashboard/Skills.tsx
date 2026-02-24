import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SkillTable from "@/components/skills/SkillTable";
import SkillModal from "@/components/skills/SkillModal";
import { useSkills } from "@/hooks/Skills/useSkills";
import { Sparkles, Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function Skills() {
    const {
        skills,
        isModalOpen,
        selectedSkill,
        loading,
        page,
        setPage,
        total,
        limit,
        searchQuery,
        setSearchQuery,
        handleAddSkill,
        handleEditSkill,
        handleDeleteSkill,
        handleModalClose,
        handleSuccess
    } = useSkills();

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 p-6 sm:p-8 shadow-xl shadow-violet-500/20 border border-violet-500/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner border border-white/20">
                            <Sparkles className="h-7 w-7 text-white drop-shadow-sm" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">Skills Management</h1>
                            <p className="text-primary-foreground/80 text-sm sm:text-base mt-1 font-medium">Tag and categorize employee competencies</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative lg:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/60" />
                            <Input
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full pl-10 bg-black/10 border-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/30 rounded-xl shadow-inner transition-colors hover:bg-black/20"
                            />
                        </div>
                        <Button
                            onClick={handleAddSkill}
                            className="h-11 bg-white text-violet-700 hover:bg-white/90 font-bold shadow-lg shadow-black/10 gap-2 whitespace-nowrap rounded-xl px-5 hover:scale-105 transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Add Skill
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-2xl shadow-xl shadow-violet-500/5 border border-border/40 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-violet-600 mb-4" />
                        <p className="text-base font-medium animate-pulse">Loading skills directory...</p>
                    </div>
                ) : (
                    <>
                        <SkillTable skills={skills} onEdit={handleEditSkill} onDelete={handleDeleteSkill} />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center bg-card border-t border-border rounded-b-xl">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
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
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

            <SkillModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialData={selectedSkill}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
