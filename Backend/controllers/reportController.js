const Report = require("../models/Report");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const User = require("../models/User");

// Submit a report
const createReport = async (req, res) => {
    try {
        const { contentType, contentId, reason, description } = req.body;

        // Validate required fields
        if (!contentType || !contentId || !reason) {
            return res.status(400).json({
                success: false,
                message: "Content type, content ID and reason are required"
            });
        }

        // Validate content type
        if (!["Question", "Answer"].includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content type"
            });
        }

        // Find logged-in user
        const user = await User.findOne({ phone: req.user.phone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check whether reported content exists
        let content;

        if (contentType === "Question") {
            content = await Question.findById(contentId);
        } else {
            content = await Answer.findById(contentId);
        }

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Reported content not found"
            });
        }

        // Prevent reporting your own content
        const ownerId = contentType === "Question"
            ? content.askedBy
            : content.answeredBy;

        if (ownerId.toString() === user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot report your own content"
            });
        }

        // Create report
        const report = await Report.create({
            reportedBy: user._id,
            contentType,
            contentId,
            reason,
            description: description || ""
        });

        return res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            report
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already reported this content"
            });
        }

        console.error("Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit report"
        });
    }
};

module.exports = { createReport };