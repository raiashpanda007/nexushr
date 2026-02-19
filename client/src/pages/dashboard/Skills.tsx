
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

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const result = await ApiCaller<null, Skill[]>({
                requestType: "GET",
                paths: ["api", "v1", "skills"],
            });

            if (result.ok) {
                setSkills(result.response.data || []);
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
        fetchSkills();
    }, []);

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
                fetchSkills();
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
        fetchSkills();
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
                    <SkillTable skills={skills} onEdit={handleEditSkill} onDelete={handleDeleteSkill} />
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
