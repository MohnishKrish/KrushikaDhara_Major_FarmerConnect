const mongoose = require("mongoose")

const answerSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true
        },
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true
        },
        answeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        upvotes: {
            type: Number,
            default: 0,
            min: 0
        },
        upvotedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]

},
{
    timestamps: true
})

module.exports = mongoose.model("Answer",answerSchema)