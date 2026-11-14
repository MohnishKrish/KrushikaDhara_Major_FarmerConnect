const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    district: {
        type: String,
        required: true,
        trim: true,
    },
    crops: [
        {
            type: String,
        },
    ],
    profileImage: {
        type: String,
        default: "",
    },
    reputation: {
        type: Number,
        default: 0,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
},{
    timestamps: true,
});

module.exports = mongoose.model("User",userSchema)