const express = require("express")
const multer = require("multer")
const cors = require("cors");
require("dotenv").config()
const app = express()
const PORT = process.env.PORT
const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const questionRoutes =require("./routes/questionRoutes")
const answerRoutes =require("./routes/answerRoutes")
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const blogRoutes = require("./routes/blogRoutes");

app.use(cors());
app.use(express.json())
app.use("/api/auth",authRoutes)
app.use("/api/questions",questionRoutes)
app.use("/api/answers", answerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/blogs", blogRoutes);
connectDB()

app.get("/",function(req,res){
    res.send("farmerConnect Backend running")
})

app.use(function(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.code === "LIMIT_FILE_COUNT"
                ? "You can upload a maximum of 3 images"
                : err.code === "LIMIT_FILE_SIZE"
                ? "Each image must be 5 MB or smaller"
                : err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});