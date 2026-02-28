import mongoose from "mongoose";

const AssetHistorySchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assets",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        required: true
    },
})

const AssetHistoryModel = mongoose.model("AssetHistory", AssetHistorySchema);


export default AssetHistoryModel