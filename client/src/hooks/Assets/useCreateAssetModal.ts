import { useEffect, useState, useCallback, useRef } from "react";
import ApiCaller from "@/utils/ApiCaller";
import axios from "axios";

interface UseCreateAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface SignedUrlResponse {
    signedUrl: string;
}

interface SearchUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deptId?: { _id: string; name: string };
}

const INITIAL_FORM = {
    name: "",
    photoURL: "",
    description: "",
    status: "AVAILABLE",
    currentOwner: "",
    purchaseDate: "",
    purchasePrice: "",
    warrantyPeriod: "",
    notes: "",
};

export function useCreateAssetModal({ isOpen, onClose, onSuccess }: UseCreateAssetModalProps) {
    const [formData, setFormData] = useState({ ...INITIAL_FORM });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image upload state
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Employee search for owner field
    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({ ...INITIAL_FORM });
            setError(null);
            setPreviewUrl(null);
            setSearchQuery("");
            setSearchResults([]);
            setSelectedUser(null);
            setSearching(false);
            setEmployeeSearchOpen(false);
        }
    }, [isOpen]);

    const searchEmployees = useCallback(async (query: string) => {
        if (!query.trim() || query.trim().length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        try {
            const result = await ApiCaller<null, SearchUser[]>({
                requestType: "GET",
                paths: ["api", "v1", "search", "users"],
                queryParams: { query: query.trim() },
            });
            if (result.ok && Array.isArray(result.response.data)) {
                setSearchResults(result.response.data);
            } else {
                setSearchResults([]);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchEmployees(value), 400);
    };

    const handleSelectOwner = (user: SearchUser) => {
        setSelectedUser(user);
        setFormData((prev) => ({ ...prev, currentOwner: user._id }));
        setEmployeeSearchOpen(false);
    };

    const handleClearOwner = () => {
        setSelectedUser(null);
        setFormData((prev) => ({ ...prev, currentOwner: "" }));
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setError(null);
        setUploading(true);

        try {
            const result = await ApiCaller<null, SignedUrlResponse>({
                requestType: "GET",
                paths: ["api", "v1", "assets", "upload-url"],
                queryParams: { fileName: file.name, contentType: file.type },
            });

            if (!result.ok || !result.response.data?.signedUrl) {
                throw new Error("Failed to get upload URL");
            }

            const { signedUrl } = result.response.data;

            await axios.put(signedUrl, file, {
                headers: { "Content-Type": file.type },
            });

            const publicUrl = signedUrl.split("?")[0];
            setFormData((prev) => ({ ...prev, photoURL: publicUrl }));
        } catch {
            setError("Failed to upload image. Please try again.");
            setPreviewUrl(null);
            setFormData((prev) => ({ ...prev, photoURL: "" }));
        } finally {
            setUploading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value: string) => {
        setFormData((prev) => ({ ...prev, status: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (!formData.purchaseDate.trim()) { setError("Purchase date is required"); setLoading(false); return; }
        if (!formData.purchasePrice) { setError("Purchase price is required"); setLoading(false); return; }
        if (formData.status === "ASSIGNED" && !formData.currentOwner) {
            setError("Owner is required when status is Assigned");
            setLoading(false);
            return;
        }

        try {
            const body = { ...formData };
            if (!body.currentOwner) {
                delete (body as Record<string, unknown>).currentOwner;
            }

            const result = await ApiCaller({
                requestType: "POST",
                paths: ["api", "v1", "assets"],
                body,
            });

            if (result.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.response.message || "Failed to create asset");
            }
        } catch {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        uploading,
        previewUrl,
        error,
        employeeSearchOpen,
        setEmployeeSearchOpen,
        searchQuery,
        searchResults,
        searching,
        selectedUser,
        handleChange,
        handleFileSelect,
        handleStatusChange,
        handleSelectOwner,
        handleClearOwner,
        handleSearchChange,
        handleSubmit,
    };
}
