import { useState, useEffect } from "react";
import ApiCaller from "@/utils/ApiCaller";
import type { MyInterview } from "@/types/hiring";
import { toast } from "sonner";

export function useMyReviews() {
    const [interviews, setInterviews] = useState<MyInterview[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED">("UPCOMING");

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const result = await ApiCaller<null, { interviews: MyInterview[] }>({
                requestType: "GET",
                paths: ["api", "v1", "hiring", "interviews", "my"],
            });
            if (result.ok) {
                setInterviews(result.response.data.interviews);
            } else {
                toast.error(
                    (result.response as unknown as { message?: string })?.message ||
                        "Failed to load interviews",
                );
            }
        } catch {
            toast.error("Failed to load interviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const now = new Date();

    const filteredInterviews = interviews.filter((iv) => {
        if (filter === "UPCOMING") {
            return iv.status === "SCHEDULED" && new Date(iv.reviewDate) >= now;
        }
        if (filter === "COMPLETED") {
            return iv.status === "COMPLETED" || iv.status === "CANCELED";
        }
        return true;
    });

    return {
        interviews: filteredInterviews,
        allInterviews: interviews,
        loading,
        filter,
        setFilter,
        refetch: fetchInterviews,
    };
}
