import { useState, useEffect, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import { toast } from "sonner";
import type { EnrolledStudent } from "@/types/training";

interface SkillOption {
    _id: string;
    name: string;
    category: string;
}

interface SearchResult extends EnrolledStudent {
    deptId?: { _id: string; name: string };
}

const ENROLLED_PAGE_LIMIT = 10;

export function useEnrollStudents(lessonId: string) {
    // ── Enrolled students ────────────────────────────────────────────────
    const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
    const [enrolledLoading, setEnrolledLoading] = useState(false);
    const [enrolledPage, setEnrolledPage] = useState(1);
    const [enrolledTotal, setEnrolledTotal] = useState(0);

    const fetchEnrolled = useCallback(async (page = 1) => {
        setEnrolledLoading(true);
        try {
            const res = await ApiCaller<null, { data: EnrolledStudent[]; total: number; page: number; limit: number }>({
                requestType: "GET",
                paths: ["api", "v1", "training", "programs", "lesson", lessonId, "students"],
                queryParams: { page: String(page), limit: String(ENROLLED_PAGE_LIMIT) },
            });
            if (res.ok) {
                setEnrolled(res.response.data?.data ?? []);
                setEnrolledTotal(res.response.data?.total ?? 0);
                setEnrolledPage(page);
            }
        } finally {
            setEnrolledLoading(false);
        }
    }, [lessonId]);

    useEffect(() => { fetchEnrolled(1); }, [fetchEnrolled]);

    // ── Remove a student ─────────────────────────────────────────────────
    const removeStudent = async (studentId: string) => {
        const res = await ApiCaller<null, null>({
            requestType: "DELETE",
            paths: ["api", "v1", "training", "programs", "lesson", lessonId, "students", studentId],
        });
        if (res.ok) {
            toast.success("Student removed");
            await fetchEnrolled(enrolledPage);
        } else {
            toast.error((res.response as any)?.message ?? "Failed to remove student");
        }
    };

    // ── Add students by IDs ───────────────────────────────────────────────
    const [enrolling, setEnrolling] = useState(false);

    const addStudents = async (studentIds: string[]): Promise<boolean> => {
        setEnrolling(true);
        try {
            const res = await ApiCaller<any, any>({
                requestType: "POST",
                paths: ["api", "v1", "training", "programs", "lesson", lessonId, "students"],
                body: { studentIds },
            });
            if (res.ok) {
                toast.success(res.response.message ?? "Students enrolled");
                await fetchEnrolled(1);
                return true;
            }
            toast.error((res.response as any)?.message ?? "Failed to enroll students");
            return false;
        } finally {
            setEnrolling(false);
        }
    };

    // ── Employee search (name) ────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const timeout = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await ApiCaller<null, SearchResult[]>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "employees"],
                    queryParams: { query: searchQuery, limit: "20" },
                });
                if (res.ok) {
                    // Only show employees (not HR)
                    setSearchResults(
                        (res.response.data ?? []).filter((u: any) => u.role === "EMPLOYEE")
                    );
                }
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // ── Skill-level filter ────────────────────────────────────────────────
    const [skills, setSkills] = useState<SkillOption[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [skillSearch, setSkillSearch] = useState("");
    const [selectedSkillId, setSelectedSkillId] = useState("");
    const [maxLevel, setMaxLevel] = useState(3);
    const [enrollingBySkill, setEnrollingBySkill] = useState(false);

    // Fetch skills for the dropdown
    useEffect(() => {
        if (!skillSearch.trim()) { setSkills([]); return; }
        const timeout = setTimeout(async () => {
            setSkillsLoading(true);
            try {
                const res = await ApiCaller<null, SkillOption[]>({
                    requestType: "GET",
                    paths: ["api", "v1", "search", "skills"],
                    queryParams: { query: skillSearch, limit: "20" },
                });
                if (res.ok) setSkills(res.response.data ?? []);
            } finally {
                setSkillsLoading(false);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [skillSearch]);

    // Fetch matching employees from dedicated endpoint then enroll directly
    const enrollBySkill = useCallback(async () => {
        if (!selectedSkillId) return;
        setEnrollingBySkill(true);
        try {
            const res = await ApiCaller<null, EnrolledStudent[]>({
                requestType: "GET",
                paths: ["api", "v1", "training", "programs", "lesson", lessonId, "students", "preview-by-skill"],
                queryParams: { skillId: selectedSkillId, maxLevel: maxLevel.toString() },
            });
            if (!res.ok) { toast.error("Failed to fetch matching employees"); return; }

            const matches: EnrolledStudent[] = res.response.data ?? [];
            const toEnroll = matches.filter((m) => !m.alreadyEnrolled).map((m) => m._id);

            if (toEnroll.length === 0) {
                toast.info("All matching employees are already enrolled");
                return;
            }
            await addStudents(toEnroll);
        } finally {
            setEnrollingBySkill(false);
        }
    }, [lessonId, selectedSkillId, maxLevel, addStudents]);

    return {
        // Enrolled
        enrolled,
        enrolledLoading,
        enrolledPage,
        enrolledTotal,
        enrolledPageLimit: ENROLLED_PAGE_LIMIT,
        fetchEnrolled,
        removeStudent,
        // Add
        enrolling,
        addStudents,
        // Search
        searchQuery,
        setSearchQuery,
        searchResults,
        searching,
        // Skill filter
        skillSearch,
        setSkillSearch,
        skills,
        skillsLoading,
        selectedSkillId,
        setSelectedSkillId,
        maxLevel,
        setMaxLevel,
        enrollingBySkill,
        enrollBySkill,
    };
}
