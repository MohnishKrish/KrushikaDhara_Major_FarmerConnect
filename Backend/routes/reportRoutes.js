const express = require("express");
const router = express.Router();

const { createReport } = require("../controllers/reportController");
const verifyToken = require("../middleware/verifyToken");

// Submit a report
router.post("/", verifyToken, createReport);

module.exports = router;