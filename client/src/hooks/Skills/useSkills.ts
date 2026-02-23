import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";

export interface Skill {
    _id: string;
    name: string;
    category: string;
}

export function useSkills() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchSkills = async (currentPage = 1, query: string = "") => {
        setLoading(true);
        try {
            let apiSkills: Skill[] = [];
            let apiTotal = 0;

            if (navigator.onLine) {
                if (query.trim()) {
                    const result = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "search", "skills"],
                        queryParams: { query: query.trim() }
                    });

                    if (result.ok) {
                        const responseData = result.response.data;
                        if (Array.isArray(responseData)) {
                            apiSkills = responseData;
                        } else if (responseData && responseData.data) {
                            apiSkills = responseData.data;
                        }
                        apiTotal = apiSkills.length;
                    } else {
                        console.error("Failed to search skills:", result.response.message);
                    }
                } else {
                    const result = await ApiCaller<null, any>({
                        requestType: "GET",
                        paths: ["api", "v1", "skills"],
                        queryParams: { page: currentPage.toString(), limit: limit.toString() }
                    });

                    if (result.ok) {
                        if (Array.isArray(result.response.data)) {
                            apiSkills = result.response.data;
                        } else if (result.response.data?.data) {
                            apiSkills = result.response.data.data;
                            apiTotal = result.response.data.total || 0;
                        }
                    } else {
                        console.error("Failed to fetch skills:", result.response.message);
                    }
                }
            }

            setSkills(apiSkills);
            setTotal(apiTotal);
        } catch (error) {
            console.error("Error fetching skills:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSkills(page, searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, searchQuery]);

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
                fetchSkills(page, searchQuery);
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
        fetchSkills(page, searchQuery);
    };

    return {
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
    };
}
