const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        crop: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        images: [
            {

        url: {

            type: String

        },

        public_id: {

            type: String

        }

    }
            
        ],
        voiceNote: {
            type: String,
            default: ""
        },
        askedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        upvotes: {
            type: Number,
            default: 0
        },
        upvotedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
        
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Question", questionSchema)