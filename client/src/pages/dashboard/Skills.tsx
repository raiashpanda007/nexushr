import { Button } from "@/components/ui/button";
import SkillTable from "@/components/skills/SkillTable";
import SkillModal from "@/components/skills/SkillModal";
import { useSkills } from "@/hooks/Skills/useSkills";

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
        handleAddSkill,
        handleEditSkill,
        handleDeleteSkill,
        handleModalClose,
        handleSuccess
    } = useSkills();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Skills Management</h1>
                <Button onClick={handleAddSkill}>Add Skill</Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading skills...</div>
                ) : (
                    <>
                        <SkillTable skills={skills} onEdit={handleEditSkill} onDelete={handleDeleteSkill} />
                        {total > 0 && (
                            <div className="p-4 flex justify-between items-center border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                                        disabled={page === Math.ceil(total / limit) || Math.ceil(total / limit) === 0}
                                    >
                                        Next
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
