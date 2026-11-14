const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true
        },
        type: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        },
        answer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Answer"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Notification", notificationSchema)