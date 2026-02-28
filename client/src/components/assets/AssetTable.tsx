import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, Hash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/hooks/Assets/useAssets";

interface AssetTableProps {
    assets: Asset[];
    startIndex?: number;
    isHR: boolean;
}

const STATUS_STYLES: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
    ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    MAINTENANCE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    DISPOSED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
};

export default function AssetTable({ assets, startIndex = 1, isHR }: AssetTableProps) {
    const navigate = useNavigate();

    if (!assets || assets.length === 0) {
        return (
            <Card className="w-full border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <Package className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">No assets found</p>
                    <p className="text-sm mt-1">Assets will appear here once created.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden border-0 shadow-lg gap-0 py-0">
            <CardHeader className="bg-muted/30 text-foreground py-5 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-background/60 border border-border">
                        <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Assets</CardTitle>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {assets.length} asset{assets.length !== 1 ? "s" : ""} listed
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-12 font-semibold">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            </TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Purchase Date</TableHead>
                            <TableHead className="font-semibold text-right">Price</TableHead>
                            {isHR && (
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.map((asset, idx) => (
                            <TableRow
                                key={asset._id}
                                className="group hover:bg-muted/20 transition-colors cursor-pointer"
                                onClick={() => isHR && navigate(`/assets/${asset._id}`)}
                            >
                                <TableCell className="font-medium text-muted-foreground text-sm">
                                    {startIndex + idx}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={asset.photoURL}
                                            alt={asset.name}
                                            className="h-9 w-9 rounded-lg object-cover border border-border/50"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://placehold.co/36x36?text=?";
                                            }}
                                        />
                                        <div>
                                            <p className="font-semibold text-foreground">{asset.name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-50">
                                                {asset.description}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`text-[11px] font-semibold ${STATUS_STYLES[asset.status] || ""}`}
                                    >
                                        {asset.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(asset.purchaseDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ₹{asset.purchasePrice.toLocaleString()}
                                </TableCell>
                                {isHR && (
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/assets/${asset._id}`);
                                            }}
                                        >
                                            <Eye className="h-4 w-4" /> View
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
