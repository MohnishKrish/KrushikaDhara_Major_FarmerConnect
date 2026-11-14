const cloudinary = require("./cloudinary");

const uploadImage = async function(fileBuffer, folder = "farmerconnect/questions") {
    return new Promise(function(resolve, reject) {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "image"
            },
            function(error, result) {
                if (error) {
                    return reject(error);
                }

                resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        stream.end(fileBuffer);
    });
};

module.exports = uploadImage;