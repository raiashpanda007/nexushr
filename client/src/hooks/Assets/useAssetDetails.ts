import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCaller from "@/utils/ApiCaller";
import { useAppSelector } from "@/store/hooks";
import type { Asset } from "./useAssets";

export interface AssetHistoryItem {
    _id: string;
    assetId: string;
    userId: {
        _id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email: string;
    };
    date: string;
    notes: string;
}

interface AssetDetailResponse {
    asset: Asset;
    assetHistory: AssetHistoryItem[];
}

export function useAssetDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userDetails } = useAppSelector((state) => state.userState);
    const role = userDetails?.role?.toUpperCase() || "";

    const [asset, setAsset] = useState<Asset | null>(null);
    const [history, setHistory] = useState<AssetHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchAssetDetails = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const result = await ApiCaller<null, AssetDetailResponse>({
                requestType: "GET",
                paths: ["api", "v1", "assets", id],
            });

            if (result.ok) {
                const data = result.response.data;
                if (data.asset) {
                    setAsset(data.asset);
                    setHistory(data.assetHistory || []);
                } else {
                    setAsset(data as unknown as Asset);
                    setHistory([]);
                }
            } else {
                setError(result.response.message || "Asset not found");
            }
        } catch {
            setError("Failed to fetch asset details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAssetDetails();
    }, [fetchAssetDetails]);

    const goBack = () => navigate("/assets");

    const handleOpenEdit = () => setIsEditOpen(true);
    const handleCloseEdit = () => setIsEditOpen(false);
    const handleEditSuccess = () => {
        setIsEditOpen(false);
        fetchAssetDetails();
    };

    return {
        asset,
        history,
        loading,
        error,
        role,
        isEditOpen,
        goBack,
        handleOpenEdit,
        handleCloseEdit,
        handleEditSuccess,
    };
}
