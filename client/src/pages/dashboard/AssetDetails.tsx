import { useAssetDetails } from "@/hooks/Assets/useAssetDetails";
import EditAssetModal from "@/components/assets/EditAssetModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Shield,
    StickyNote,
    Users,
    Loader2,
    History,
    Pencil,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
    ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    MAINTENANCE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    DISPOSED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
};

export default function AssetDetails() {
    const { asset, history, loading, error, role, isEditOpen, goBack, handleOpenEdit, handleCloseEdit, handleEditSuccess } = useAssetDetails();
    const isHR = role === "HR";

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-base font-medium text-muted-foreground animate-pulse">
                    Loading asset details...
                </p>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
                <p className="text-lg font-medium text-muted-foreground">
                    {error || "Asset not found"}
                </p>
                <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Assets
                </Button>
            </div>
        );
    }

    const purchaseDate = new Date(asset.purchaseDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
            {/* Back button + Edit button */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={goBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Assets
                </Button>
                {isHR && (
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleOpenEdit}
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Asset
                    </Button>
                )}
            </div>

            {/* Asset Header Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        <img
                            src={asset.photoURL}
                            alt={asset.name}
                            className="h-24 w-24 rounded-2xl object-cover border border-border/50 shadow-md"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/96x96?text=?";
                            }}
                        />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <CardTitle className="text-2xl font-bold">{asset.name}</CardTitle>
                                <Badge
                                    variant="outline"
                                    className={`text-xs font-semibold ${STATUS_STYLES[asset.status] || ""}`}
                                >
                                    {asset.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {asset.description}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <Separator className="mx-6 w-auto!" />

                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Purchase Date
                                </p>
                                <p className="text-sm font-semibold text-foreground mt-0.5">{purchaseDate}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Purchase Price
                                </p>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                    ₹{asset.purchasePrice.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Warranty Period
                                </p>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                    {asset.warrantyPeriod}
                                </p>
                            </div>
                        </div>
                    </div>

                    {asset.notes && (
                        <div className="mt-5 flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/40">
                            <StickyNote className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                                    Notes
                                </p>
                                <p className="text-sm text-foreground leading-relaxed">{asset.notes}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ownership History */}
            {history.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50">
                                <History className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Ownership History</CardTitle>
                                <p className="text-muted-foreground text-sm mt-0.5">
                                    {history.length} transfer{history.length !== 1 ? "s" : ""} recorded
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="font-semibold">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-muted-foreground" /> Assigned To
                                        </span>
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date
                                        </span>
                                    </TableHead>
                                    <TableHead className="font-semibold">Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((entry) => {
                                    const userName = entry.userId
                                        ? entry.userId.name ||
                                          `${entry.userId.firstName || ""} ${entry.userId.lastName || ""}`.trim() ||
                                          entry.userId.email
                                        : "Unknown";

                                    return (
                                        <TableRow key={entry._id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-foreground">{userName}</p>
                                                    {entry.userId?.email && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {entry.userId.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(entry.date).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-75 truncate">
                                                {entry.notes}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {isHR && (
                <EditAssetModal
                    isOpen={isEditOpen}
                    asset={asset}
                    onClose={handleCloseEdit}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}
