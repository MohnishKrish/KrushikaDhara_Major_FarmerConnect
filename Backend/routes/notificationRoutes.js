const express = require("express")
const router = express.Router()

const {getMyNotification, markAsRead, markAllAsRead, deleteNotification} = require("../controllers/notificationController")
const verifyToken = require("../middleware/verifyToken")

router.get("/my",verifyToken,getMyNotification)
router.patch("/read-all",verifyToken,markAllAsRead);
router.patch("/:notificationId/read",verifyToken,markAsRead);
router.delete("/:notificationId", verifyToken, deleteNotification);


module.exports = router;