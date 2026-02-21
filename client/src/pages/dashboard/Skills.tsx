
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SkillTable from "@/components/skills/SkillTable";
import SkillModal from "@/components/skills/SkillModal";
import ApiCaller from "@/utils/ApiCaller";

interface Skill {
    _id: string;
    name: string;
    category: string;
}

export default function Skills() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchSkills = async (currentPage = 1) => {
        setLoading(true);
        try {
            const result = await ApiCaller<null, any>({
                requestType: "GET",
                paths: ["api", "v1", "skills"],
                queryParams: { page: currentPage.toString(), limit: limit.toString() }
            });

            if (result.ok) {
                if (Array.isArray(result.response.data)) {
                    setSkills(result.response.data);
                } else if (result.response.data?.data) {
                    setSkills(result.response.data.data);
                    setTotal(result.response.data.total || 0);
                }
            } else {
                console.error("Failed to fetch skills:", result.response.message);
            }
        } catch (error) {
            console.error("Error fetching skills:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills(page);
    }, [page]);

    const handleAddSkill = () => {
        setSelectedSkill(null);
        setIsModalOpen(true);
    };

    const handleEditSkill = (skill: Skill) => {
        setSelectedSkill(skill);
        setIsModalOpen(true);
    };

    const handleDeleteSkill = async (id: string) => {
        if (!confirm("Are you sure you want to delete this skill?")) return;

        try {
            const result = await ApiCaller({
                requestType: "DELETE",
                paths: ["api", "v1", "skills", id],
            });
            if (result.ok) {
                fetchSkills(page);
            } else {
                alert("Failed to delete: " + result.response.message);
            }
        } catch (error) {
            alert("Error deleting skill");
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedSkill(null);
    };

    const handleSuccess = () => {
        fetchSkills(page);
    };

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
