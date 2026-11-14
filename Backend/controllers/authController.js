const User = require("../models/User")
const jwt = require("jsonwebtoken")

const sendOTP = async function(req,res){
    try{
   const {phone} = req.body;

   if(!phone){
    return res.status(400).json({
        success: false,
        message: "Phone Number Required"
    })
   }
   return res.status(200).json({
    success: true,
    message: "OTP sent successfully"
   })
}catch(error){
    console.error("Send OTP error:", error);

    return res.status(500).json({

        success: false,

        message: "Failed to send OTP"

    });
}
}

const verifyOTP = async function (req, res) {
    try {
        const { phone, otp } = req.body;

        if (
            !phone ||
            typeof phone !== "string" ||
            !phone.trim() ||
            otp === undefined ||
            otp === null ||
            String(otp).trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Phone Number and OTP Required"
            });
        }

        if (String(otp) !== "123456") {
            return res.status(401).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }

        const existingUser = await User.findOne({
            phone: phone.trim()
        });

        const token = jwt.sign(
            { phone: phone.trim() },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token,
            isNewUser: !existingUser,

            user: existingUser ? {
                _id: existingUser._id,
                name: existingUser.name,
                phone: existingUser.phone,
                district: existingUser.district,
                crops: existingUser.crops,
                profileImage: existingUser.profileImage
            } : null
        });

    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP"
        });
    }
};
const completeProfile = async function(req,res){
    try{
        if (!req.user || !req.user.phone) {
            return res.status(401).json({
    success: false,
    message: "Authentication required"
    });
    }
    const phone = req.user.phone;
    const { name, district, crops, profileImage} = req.body
    if (

        typeof name !== "string" ||

        !name.trim() ||

        typeof district !== "string" ||

        !district.trim() ||

        !Array.isArray(crops) ||

        crops.length === 0 ||

        !crops.every(

            crop => typeof crop === "string" && crop.trim().length > 0

        )

    ) {

        return res.status(400).json({

            success: false,

            message: "Provide a valid name, district, and crops array"

        });

    }

    if (

        profileImage !== undefined &&

        typeof profileImage !== "string"

    ) {

        return res.status(400).json({

            success: false,

            message: "Invalid profile image"

        });

    }

   

    const userExisting = await User.findOne({phone})

    if(userExisting){
        return res.status(409).json({
            success: false,
            message: "profile Already Exists"
        })
    }

    const user = await User.create({
        phone,
        name: name.trim(),
        district: district.trim(),
        crops: crops.map(crop=>crop.trim()),
        profileImage: profileImage || ""
    })
    return res.status(201).json({
        success: true,
        message: "Profile completed successfully",
        user
    })
   }catch(error){
    console.error("Complete profile error:", error);

    

    if (error.code === 11000) {

        return res.status(409).json({

            success: false,

            message: "Profile already exists"

        });

    }
    res.status(500).json({
        success: false,
        message: "Failed to complete Profile"
    })
   }
}

module.exports = {
    sendOTP,
    verifyOTP,
    completeProfile
}