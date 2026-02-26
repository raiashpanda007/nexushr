import { useState, useCallback } from "react";
import ApiCaller from "@/utils/ApiCaller";
import axios from "axios";

interface UseImageUploadOptions {
    /** Initial profile photo URL (for edit mode) */
    initialUrl?: string;
}

interface SignedUrlResponse {
    signedUrl: string;
}

export function useImageUpload({ initialUrl }: UseImageUploadOptions = {}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(initialUrl ?? null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const reset = useCallback((url?: string) => {
        setPreviewUrl(url ?? null);
        setPhotoUrl(url ?? null);
        setUploading(false);
        setUploadError(null);
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Image must be less than 5MB");
            return;
        }

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setUploadError(null);
        setUploading(true);

        try {
            const fileName = `profiles/${Date.now()}-${file.name}`;

            // Step 1: Get signed URL from backend
            const signedUrlResult = await ApiCaller<null, SignedUrlResponse>({
                requestType: "GET",
                paths: ["api", "v1", "user", "get-signed-url"],
                queryParams: {
                    fileName,
                    contentType: file.type,
                },
            });

            if (!signedUrlResult.ok || !signedUrlResult.response.data?.signedUrl) {
                throw new Error("Failed to get upload URL");
            }

            const { signedUrl } = signedUrlResult.response.data;

            // Step 2: Upload file to S3 via signed URL
            await axios.put(signedUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
            });

            // Step 3: Construct the public URL from the signed URL (strip query params)
            const publicUrl = signedUrl.split("?")[0];
            setPhotoUrl(publicUrl);
        } catch (err) {
            console.error("Image upload failed:", err);
            setUploadError("Failed to upload image. Please try again.");
            setPreviewUrl(initialUrl ?? null);
            setPhotoUrl(initialUrl ?? null);
        } finally {
            setUploading(false);
        }
    }, [initialUrl]);

    return {
        previewUrl,
        photoUrl,
        uploading,
        uploadError,
        handleFileSelect,
        reset,
    };
}
