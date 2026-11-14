const express = require("express")


const router = express.Router()

const {createQuestion} = require("../controllers/questionController")
const verifyToken = require("../middleware/verifyToken")
const upload = require("../middleware/upload")
const validateImageContents = require("../middleware/validateImageContents")
const processImage = require("../middleware/processImage")
const {getAllQuestions} = require("../controllers/questionController")
const {getQuestionById} = require("../controllers/questionController")
const {updateQuestion} = require("../controllers/questionController")
const {deleteQuestion} = require("../controllers/questionController")
const {upvoteQuestion} = require("../controllers/questionController")
const {removeUpvote} = require("../controllers/questionController")
const {getMyQuestions} = require("../controllers/questionController")



router.post("/",verifyToken,upload.array("images",3),validateImageContents,processImage,createQuestion)
router.get("/",verifyToken,getAllQuestions)
router.get("/my",verifyToken,getMyQuestions)
router.get("/:id",verifyToken,getQuestionById)
router.put("/:id",verifyToken,upload.array("images",3),validateImageContents,processImage,updateQuestion)
router.delete("/:id",verifyToken,deleteQuestion)
router.put("/:id/upvote",verifyToken,upvoteQuestion)
router.delete("/:id/upvote",verifyToken,removeUpvote)


module.exports = router