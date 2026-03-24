import { useState, useRef } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const [step, setStep] = useState<"decide" | "compose">("decide");
    const [rejectLoading, setRejectLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep("decide");
        setSubject("");
        setMessage("");
        setAttachedFile(null);
        setError(null);
    };

    const handleOpenChange = (val: boolean) => {
        if (!val) resetState();
        onOpenChange(val);
    };

    const handleRejectApplicant = async () => {
        setRejectLoading(true);
        try {
            const result = await ApiCaller({
                requestType: "PATCH",
                paths: ["api", "v1", "hiring", "applicants", applicantId],
                body: { status: "REJECTED" },
            });
            if (result.ok) {
                handleOpenChange(false);
                onSuccess();
            }
        } catch (err) {
            console.error("Error rejecting applicant:", err);
        } finally {
            setRejectLoading(false);
        }
    };

    const uploadDocument = async (file: File): Promise<string> => {
        const signedRes = await ApiCaller<{ fileName: string; contentType: string }, { signedUrl: string }>({
            requestType: "POST",
            paths: ["api", "v1", "hiring", "applicants", "signed-url"],
            body: { fileName: file.name, contentType: "application/pdf" },
        });
        if (!signedRes.ok) throw new Error("Failed to get upload URL");

        const signedUrl = signedRes.response.data.signedUrl;
        const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": "application/pdf" },
        });
        if (!uploadRes.ok) throw new Error("Failed to upload document");

        // Return the permanent S3 URL (strip query params from signed URL)
        const url = new URL(signedUrl);
        return `${url.origin}${url.pathname}`;
    };

    const handleSendOffer = async () => {
        if (!message.trim()) {
            setError("Please enter a message.");
            return;
        }
        setError(null);
        setSendLoading(true);
        try {
            let attachmentUrl: string | undefined;
            if (attachedFile) {
                attachmentUrl = await uploadDocument(attachedFile);
            }

            const result = await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "hiring", "applicants", applicantId, "send-offer"],
                body: {
                    subject: subject.trim() || undefined,
                    message: message.trim(),
                    ...(attachmentUrl && { attachmentUrl }),
                },
            });
            if (result.ok) {
                handleOpenChange(false);
                onSuccess();
            } else {
                setError((result.response as any)?.message || "Failed to send offer.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            console.error("Error sending offer:", err);
        } finally {
            setSendLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {step === "decide" ? (
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
                            disabled={rejectLoading}
                            onClick={() => setStep("compose")}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            Make Offer
                        </Button>
                        <Button
                            size="lg"
                            variant="destructive"
                            disabled={rejectLoading}
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
            ) : (
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="text-lg">Compose Offer Email</DialogTitle>
                        <DialogDescription className="text-sm">
                            Write the offer email for {applicantName}. You can optionally
                            attach a document (PDF).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 pt-2 overflow-y-auto pr-1">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="offer-subject">Subject</Label>
                            <Input
                                id="offer-subject"
                                placeholder="Job Offer — [Position] (leave blank for default)"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={sendLoading}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="offer-message">
                                    Message <span className="text-destructive">*</span>
                                </Label>
                                <span className={`text-xs ${message.length >= 1000 ? "text-destructive" : "text-muted-foreground"}`}>
                                    {message.length}/1000
                                </span>
                            </div>
                            <Textarea
                                id="offer-message"
                                placeholder="Dear [Name], we are pleased to offer you..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                                disabled={sendLoading}
                                rows={6}
                                className="resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Attachment (PDF)</Label>
                            {attachedFile ? (
                                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                                    <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm flex-1 truncate">{attachedFile.name}</span>
                                    <button
                                        onClick={() => setAttachedFile(null)}
                                        disabled={sendLoading}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={sendLoading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-fit gap-2"
                                >
                                    <Paperclip className="h-4 w-4" />
                                    Attach Document
                                </Button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    setAttachedFile(f);
                                    e.target.value = "";
                                }}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-3 shrink-0 border-t border-border">
                        <Button
                            variant="outline"
                            className="flex-1"
                            disabled={sendLoading}
                            onClick={() => setStep("decide")}
                        >
                            Back
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={sendLoading || !message.trim()}
                            onClick={handleSendOffer}
                        >
                            {sendLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {sendLoading ? "Sending..." : "Send Offer"}
                        </Button>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
