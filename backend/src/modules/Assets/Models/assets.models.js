import mongoose from "mongoose";



const AssetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    photoURL: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "DISPOSED"],
        required: true
    },
    currentOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    purchaseDate: {
        type: Date,
        required: true
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    warrantyPeriod: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        required: true
    },
})


AssetSchema.index({ name: 1 });

AssetSchema.index({ currentOwner: 1 });
AssetSchema.index({ purchaseDate: 1 });
AssetSchema.index({ purchasePrice: 1 });
AssetSchema.index({ warrantyPeriod: 1 });
AssetSchema.index({ notes: 1 });

const AssetModel = mongoose.model("Assets", AssetSchema);


export default AssetModel;