const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        contentType: {
            type: String,
            enum: ["Question", "Answer"],
            required: true
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "contentType"
        },
        reason: {
            type: String,
            enum: [
                "Spam",
                "Harassment",
                "Misinformation",
                "Inappropriate Content",
                "Irrelevant Content",
                "Other"
            ],
            required: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },
        status: {
            type: String,
            enum: ["Pending", "Reviewed", "Dismissed", "Action Taken"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

reportSchema.index(
    { reportedBy: 1, contentType: 1, contentId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Report", reportSchema);