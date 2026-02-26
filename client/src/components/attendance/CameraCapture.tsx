import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
    open: boolean;
    onClose: () => void;
    onCapture: (blob: Blob) => void;
    uploading?: boolean;
}

const CameraCapture = ({ open, onClose, onCapture, uploading = false }: CameraCaptureProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        setCameraReady(false);
        setCapturedImage(null);
        setCapturedBlob(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setCameraReady(true);
                };
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            if (err.name === "NotAllowedError") {
                setCameraError("Camera access denied. Please allow camera permissions and try again.");
            } else if (err.name === "NotFoundError") {
                setCameraError("No camera found on this device.");
            } else {
                setCameraError("Unable to access camera. Please try again.");
            }
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    }, []);

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
            setCapturedImage(null);
            setCapturedBlob(null);
            setCameraError(null);
        }

        return () => stopCamera();
    }, [open, startCamera, stopCamera]);

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mirror the image horizontally for selfie camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);

        canvas.toBlob(
            (blob) => {
                if (blob) setCapturedBlob(blob);
            },
            "image/jpeg",
            0.85
        );

        stopCamera();
    }, [stopCamera]);

    const handleRetake = useCallback(() => {
        setCapturedImage(null);
        setCapturedBlob(null);
        startCamera();
    }, [startCamera]);

    const handleConfirm = useCallback(() => {
        if (capturedBlob) {
            onCapture(capturedBlob);
        }
    }, [capturedBlob, onCapture]);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-lg w-[95vw] p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <Camera className="h-5 w-5 text-red-500" />
                        Punch Out Photo
                    </DialogTitle>
                    <DialogDescription>
                        Please take a photo before punching out. This is required for attendance verification.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-4">
                    {/* Camera / Preview Area */}
                    <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
                        {cameraError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 p-6 text-center">
                                <Camera className="h-10 w-10 text-red-400 mb-3" />
                                <p className="text-sm font-medium text-red-300">{cameraError}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={startCamera}
                                    className="mt-4 text-white border-white/30 hover:bg-white/10"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                            </div>
                        ) : capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                                {!cameraReady && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                                        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                                        <p className="text-white/60 text-sm mt-2">Starting camera...</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-3">
                        {!capturedImage ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="flex-1 h-11 rounded-xl font-semibold"
                                    disabled={uploading}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCapture}
                                    disabled={!cameraReady || uploading}
                                    className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl font-semibold"
                                >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Capture
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleRetake}
                                    disabled={uploading}
                                    className="flex-1 h-11 rounded-xl font-semibold"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Retake
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={!capturedBlob || uploading}
                                    className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-semibold"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Confirm & Punch Out
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CameraCapture;
