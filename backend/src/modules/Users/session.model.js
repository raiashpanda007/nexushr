import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 60 * 60 * 24 * 30
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

SessionSchema.index({ token: 1 });
SessionSchema.index({ userId: 1 });

export const SessionModel = mongoose.model("Session", SessionSchema);
