const User = require("../models/User");
const Blog = require("../models/Blog");
const mongoose = require("mongoose")

const uploadImage = require("../config/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");

const createBlog = async function(req, res) {
    let uploadedImage = null;

    try {
        const { title, content, crop } = req.body;
        console.log("Request file:", req.file);
        console.log("Request files:", req.files);
        console.log("Request body:", req.body);

        // Validate input
        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof content !== "string" ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required"
            });
        }

        if (
            crop !== undefined &&
            (typeof crop !== "string" || !crop.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop"
            });
        }

        // Find logged-in farmer
        const user = await User.findOne({
            phone: req.user.phone
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // Upload cover image to Cloudinary
        // Upload cover image to Cloudinary
if (req.file) {
    console.log("Image received:", req.file.originalname);

    uploadedImage = await uploadImage(
        req.file.buffer,
        "farmerconnect/blogs"
    );

    console.log("Cloudinary response:", uploadedImage);
} else {
    console.log("No cover image received");
}

        // Create blog
        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            crop: crop ? crop.trim() : "General",

            coverImage: uploadedImage || {
                url: "",
                public_id: ""
            },

            author: user._id,
            district: user.district
        });

        return res.status(201).json({
            success: true,
            message: "Blog published successfully",
            blog
        });

    } catch (error) {

        // Clean up uploaded image if blog creation fails
        if (uploadedImage && uploadedImage.public_id) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedImage.public_id
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up blog image:",
                    cleanupError
                );
            }
        }

        console.error("Failed to create blog:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getAllBlogs = async function(req, res) {
    try {
        const {
            crop,
            district,
            search,
            page,
            limit,
            sort
        } = req.query;

        // Pagination
        const pageNumber = page === undefined ? 1 : Number(page);
        const limitNumber = limit === undefined ? 10 : Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters"
            });
        }

        const skip = (pageNumber - 1) * limitNumber;

        // Build filter
        let filter = {};

        if (crop) {
            filter.crop = crop;
        }

        if (district) {
            filter.district = district;
        }

        // Search by title, content or crop
        if (search) {
            if (
                typeof search !== "string" ||
                !search.trim() ||
                search.length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid search query"
                });
            }

            const safeSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { content: { $regex: safeSearch, $options: "i" } },
                { crop: { $regex: safeSearch, $options: "i" } }
            ];
        }

        // Sorting
        const allowedSorts = ["latest", "oldest", "popular"];

        if (sort && !allowedSorts.includes(sort)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort value"
            });
        }

        let sortOption = {
            createdAt: -1,
            _id: -1
        };

        if (sort === "oldest") {
            sortOption = {
                createdAt: 1,
                _id: 1
            };
        }

        if (sort === "popular") {
            sortOption = {
                likes: -1,
                _id: -1
            };
        }

        // Count total blogs
        const totalBlogs = await Blog.countDocuments(filter);

        // Fetch blogs
        const blogs = await Blog.find(filter)
            .populate("author", "name district profileImage")
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber);

        const totalPages = Math.ceil(totalBlogs / limitNumber);

        return res.status(200).json({
            success: true,
            count: blogs.length,
            page: pageNumber,
            limit: limitNumber,
            totalBlogs,
            totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1,
            blogs
        });

    } catch (error) {
        console.error("Failed to fetch blogs:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getBlogById = async function(req, res) {

    try {

        const { id } = req.params;

        // Validate MongoDB ObjectId

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message: "Invalid blog ID"

            });

        }

        // Find blog and populate author details

        const blog = await Blog.findById(id)

            .populate("author", "name district profileImage")

            .populate("likedBy", "name district");

        // Check whether blog exists

        if (!blog) {

            return res.status(404).json({

                success: false,

                message: "Blog not found"

            });

        }

        return res.status(200).json({

            success: true,

            blog

        });

    } catch (error) {

        console.error("Failed to fetch blog:", error);

        return res.status(500).json({

            success: false,

            message: "Internal server error"

        });

    }

};
const updateBlog = async function(req, res) {
    let uploadedImage = null;
    let blogSaved = false;

    try {
        const { id } = req.params;
        const { title, content, crop } = req.body;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid blog ID"
            });
        }

        // Find logged-in farmer
        const user = await User.findOne({
            phone: req.user.phone
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Find blog
        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        // Check ownership
        if (blog.author.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can update only your own blog"
            });
        }

        // Validate fields if provided
        if (
            title !== undefined &&
            (typeof title !== "string" || !title.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid title"
            });
        }

        if (
            content !== undefined &&
            (typeof content !== "string" || !content.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid content"
            });
        }

        if (
            crop !== undefined &&
            (typeof crop !== "string" || !crop.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop"
            });
        }

        if (
            title === undefined &&
            content === undefined &&
            crop === undefined &&
            !req.file
        ) {
            return res.status(400).json({
                success: false,
                message: "No update information provided"
            });
        }

        // Update text fields
        if (title !== undefined) {
            blog.title = title.trim();
        }

        if (content !== undefined) {
            blog.content = content.trim();
        }

        if (crop !== undefined) {
            blog.crop = crop.trim();
        }

        // Replace cover image if a new image is uploaded
        const oldPublicId = blog.coverImage?.public_id || "";

        if (req.file) {
            uploadedImage = await uploadImage(
                req.file.buffer,
                "farmerconnect/blogs"
            );

            blog.coverImage = uploadedImage;
        }

        // Save updated blog
        await blog.save();
        blogSaved = true;

        // Delete old image only after successful database update
        // Delete old image after successful database update
if (
    req.file &&
    oldPublicId &&
    oldPublicId !== uploadedImage.public_id
) {
    try {
        const result = await cloudinary.uploader.destroy(oldPublicId);

        console.log("Old image deletion result:", result);

    } catch (cleanupError) {
        console.error(
            "Failed to delete old blog image:",
            cleanupError
        );
    }
}

        return res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog
        });

    } catch (error) {

        // Delete newly uploaded image if database update failed
        if (!blogSaved && uploadedImage && uploadedImage.public_id) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedImage.public_id
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up new blog image:",
                    cleanupError
                );
            }
        }

        console.error("Failed to update blog:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog
};