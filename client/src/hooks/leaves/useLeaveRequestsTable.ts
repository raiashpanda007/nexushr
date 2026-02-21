import { useState } from "react";
import ApiCaller from "@/utils/ApiCaller";

export function useLeaveRequestsTable(onRefresh: () => void) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (id: string, newStatus: "ACCEPTED" | "REJECTED") => {
        setProcessingId(id);
        try {
            const result = await ApiCaller<{ status: string }, unknown>({
                requestType: "PUT",
                paths: ["api", "v1", "leaves", "requests", id],
                body: { status: newStatus },
            });
            if (result.ok) {
                onRefresh();
            } else {
                console.error("Failed to update status:", result.response?.message);
                alert("Failed to update status: " + (result.response?.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error updating status.");
        } finally {
            setProcessingId(null);
        }
    };

    return {
        processingId,
        handleAction
    };
}
