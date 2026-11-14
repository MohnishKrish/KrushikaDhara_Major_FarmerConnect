const validateImageContents = async function(req, res, next) {
    try {
        const { fileTypeFromBuffer } = await import("file-type");

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        // Support both single and multiple image uploads
        const files = req.files || (req.file ? [req.file] : []);

        for (const file of files) {
            const detectedType = await fileTypeFromBuffer(file.buffer);

            if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
                return res.status(400).json({
                    success: false,
                    message: "File content must be a genuine jpeg, png, webp image"
                });
            }
        }

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = validateImageContents;