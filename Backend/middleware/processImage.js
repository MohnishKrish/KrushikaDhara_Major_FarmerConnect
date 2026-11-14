const sharp = require("sharp");

const processImage = async function(req, res, next) {
    try {
        // Support both single and multiple image uploads
        const files = req.files || (req.file ? [req.file] : []);

        for (const file of files) {
            const processedBuffer = await sharp(file.buffer)
                .rotate()
                .resize({
                    width: 2000,
                    height: 2000,
                    fit: "inside",
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: 85
                })
                .toBuffer();

            file.buffer = processedBuffer;
            file.mimetype = "image/jpeg";
            file.originalname = file.originalname.replace(/\.[^.]+$/, ".jpg");
        }

        next();

    } catch (error) {
        if (error.message && error.message.includes("Input buffer")) {
            return res.status(400).json({
                success: false,
                message: "The uploaded image is corrupted or invalid"
            });
        }

        next(error);
    }
};

module.exports = processImage;