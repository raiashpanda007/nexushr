import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ApiCaller from "@/utils/ApiCaller";

interface OfferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicantId: string;
    applicantName: string;
    onSuccess: () => void;
}

export default function OfferDialog({
    open,
    onOpenChange,
    applicantId,
    applicantName,
    onSuccess,
}: OfferDialogProps) {
    const [rejectLoading, setRejectLoading] = useState(false);
    const [makeOfferLoading, setMakeOfferLoading] = useState(false);

    const handleRejectApplicant = async () => {
        setRejectLoading(true);
        try {
            const result = await ApiCaller({
                requestType: "PATCH",
                paths: ["api", "v1", "hiring", "applicants", applicantId],
                body: { status: "REJECTED" },
            });
            if (result.ok) {
                onOpenChange(false);
                onSuccess();
            }
        } catch (error) {
            console.error("Error rejecting applicant:", error);
        } finally {
            setRejectLoading(false);
        }
    };

    const handleMakeOffer = async () => {
        setMakeOfferLoading(true);
        try {
            const result = await ApiCaller({
                requestType: "PATCH",
                paths: ["api", "v1", "hiring", "applicants", applicantId],
                body: { status: "OFFERED" },
            });
            if (result.ok) {
                onOpenChange(false);
                onSuccess();
            }
        } catch (error) {
            console.error("Error making offer:", error);
        } finally {
            setMakeOfferLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        Applicant Passed All Rounds
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {applicantName} has successfully completed all interview rounds.
                        Please make a decision.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        size="lg"
                        disabled={rejectLoading || makeOfferLoading}
                        onClick={handleMakeOffer}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        {makeOfferLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {makeOfferLoading ? "Making Offer..." : "Make Offer"}
                    </Button>
                    <Button
                        size="lg"
                        variant="destructive"
                        disabled={rejectLoading || makeOfferLoading}
                        onClick={handleRejectApplicant}
                        className="w-full"
                    >
                        {rejectLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {rejectLoading ? "Rejecting..." : "Reject"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
