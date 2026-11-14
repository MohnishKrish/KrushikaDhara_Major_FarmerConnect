 const jwt = require("jsonwebtoken")

 const verifyToken = function(req,res,next){
    try{
    const authHeader = req.headers.authorization

    if(!authHeader){
        return res.status(401).json({
            success: false,
            message: "Access Denied. No token provided"
        })
    }

    const parts = authHeader.split(" ")

    if(parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]){
        return res.status(401).json({
            success:false,
            message: " Incorrect Authorization Header format "
        })
    }
    const token = parts[1]

    if(!process.env.JWT_SECRET){
        console.error("JWT_SECRET is not configured");

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log("Decoded:",decoded)
    req.user = decoded
    console.log("req.user",req.user)
    return next();
}catch(error){
    if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError"
    ){
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        })
    }
    console.error("Authentication middleware error:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
 }

 module.exports = verifyToken;