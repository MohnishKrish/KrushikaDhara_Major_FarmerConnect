const express = require("express")
const router = express.Router()
const verifyToken = require("../middleware/verifyToken")

const {
    sendOTP,
    verifyOTP,
    completeProfile,
} = require("../controllers/authController")

router.post("/send-otp",sendOTP)
router.post("/verify-otp",verifyOTP)
router.post("/complete-profile",verifyToken,completeProfile)
router.get("/test",verifyToken,function(req,res){
    res.json({
        success: true,
        message: "Protected route accessed",
        user: req.user
    })
})

module.exports = router;