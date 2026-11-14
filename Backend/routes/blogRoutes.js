const express = require("express");

const router = express.Router();

const {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog
} = require("../controllers/blogController");

const verifyToken = require("../middleware/verifyToken");
const upload = require("../middleware/upload");

const validateImageContents = require("../middleware/validateImageContents");
const processImage = require("../middleware/processImage");

router.post(
    "/",
    verifyToken,
    upload.single("coverImage"),
    validateImageContents,
    processImage,
    createBlog
);

router.get(

    "/",

    verifyToken,

    getAllBlogs

);
router.get(

    "/:id",

    verifyToken,

    getBlogById

);

// Update Blog
router.put(
    "/:id",
    verifyToken,
    upload.single("coverImage"),
    validateImageContents,
    processImage,
    updateBlog
);

module.exports = router;