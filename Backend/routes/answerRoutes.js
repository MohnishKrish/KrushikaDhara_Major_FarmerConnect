const express = require("express")
const router = express.Router()
const {createAnswer, getAnswers, deleteAnswer,updateAnswer, getMyAnswers, upvoteAnswer, removeAnswerUpvote} = require("../controllers/answerController")
const verifyToken = require("../middleware/verifyToken")
router.get("/my",verifyToken,getMyAnswers)
router.post("/question/:id",verifyToken,createAnswer)
router.get("/question/:id",verifyToken,getAnswers)
router.delete("/question/:id/:answerId",verifyToken,deleteAnswer)
router.put("/question/:id/:answerId",verifyToken,updateAnswer)
router.put("/question/:id/:answerId/upvote",verifyToken,upvoteAnswer)
router.delete("/question/:id/:answerId/upvote",verifyToken,removeAnswerUpvote)

module.exports = router