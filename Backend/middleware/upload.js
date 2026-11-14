const multer = require("multer")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5*1024*1024,
        files:3
    },
    fileFilter: function(req,file,cb){
        const allowedTypes=[
            "image/jpeg",
            "image/png",
            "image/webp"
        ]
        if(allowedTypes.includes(file.mimetype)){
            cb(null,true)
        }else{
            cb(new Error("Only jpeg, png, and webp are allowed"))
        }
    }
})

module.exports = upload;