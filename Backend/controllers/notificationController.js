const User = require("../models/User")
const Notification = require("../models/Notification")

const getMyNotification = async function(req,res){
    try{
        const user = await User.findOne({
            phone: req.user.phone
        })
        if(!user){
            return res.status(200).json({
                success: false,
                message: "User not found"
            })
        }
        const notifications = await Notification.find({
            recipient: user._id
        })
        .populate("sender", "name district")
        .populate("question", "title description")
        .sort({createdAt: -1})

        return res.status(200).json({
            success: true,
            message: "You have received notification from KrushikaDhara",
            count: notifications.length,
            notifications
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const markAsRead = async function(req,res){
    try{
        const {notificationId} = req.params;
        const user = await User.findOne({
            phone: req.user.phone
        })
        const notification = await Notification.findById(notificationId);
        if(!notification){
            return res.status(400).json({
                success: false,
                message: "Notification does not exist"
            })
        }
        if(notification.recipient.toString() === user._id.toString()){
            notification.isRead = true;
            await notification.save()
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        })
        }
        return res.status(403).json({
            success: false,
            message: "You are not authorized to update this notification"
        })
        
    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const markAllAsRead = async function(req,res){
    try{
    const user = await User.findOne({
        phone: req.user.phone
    })
    if(!user){
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    const result = await Notification.updateMany(
        {
            recipient: user._id,
            isRead: false
        },
        {
            $set: {
                isRead: true
            }
        }
    )
    return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount
    })
}catch(error){
    return res.status(500).json({
        success: false,
        message: error.message
    })
}
}

const deleteNotification = async function(req,res){
    try{
        const {notificationId} = req.params;
        const user = await User.findOne({
            phone: req.user.phone
        })
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const notification = await Notification.findById(notificationId);
        if(!notification){
            return res.status(404).json({
                success: false,
                message: "Notification does not exist"
            })
        }
        if(notification.recipient.toString() === user._id.toString()){
            await Notification.findByIdAndDelete(notificationId);
            return res.status(200).json({
                success: true,
                message: "Notification deleted successfully"
            })
        }
        return res.status(403).json({
            success: false,
            message: "You are not authorized to delete this notification"
        })
    }catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


module.exports = {getMyNotification, markAsRead, markAllAsRead, deleteNotification}