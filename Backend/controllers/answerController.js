const mongoose = require("mongoose")
const User = require("../models/User");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Notification = require("../models/Notification")


const createAnswer = async function(req,res){
    try{
    const { content } = req.body;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message: "Invalid question ID"

            });

        }
    if(typeof content !== "string" || !content.trim()){
        return res.status(400).json({
            success: false,
            message: "Answer content is Required"
        })
    }
    const user = await User.findOne({
        phone: req.user.phone
    })
    if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }
    const question = await Question.findById(id)
    if(!question){
        return res.status(404).json({
            success: false,
            message: "Question not found"
        })
    }

    const answer = await Answer.create({
        content: content.trim(),
        question: question._id ,
        answeredBy: user._id
    })

    if(question.askedBy.toString() !== user._id.toString()){
        try{
    await Notification.create({
        recipient: question.askedBy,
        sender: user._id,
        type: "ANSWER",
        message: "Your question has been answered",
        question: id,
        answer: answer._id
    })
}catch(notificationError){
    console.error(
        "Failed to create notification:",
        notificationError
    )
}
    }

    return res.status(201).json({
        success: true,
        message: "Answer created successfully",
        answer
    })
}catch(error){
    console.error("Failed to create answer:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
}

const getAnswers = async function(req,res){
    try{
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({

                success: false,

                message: "Invalid question ID"

            });

        }
        const question = await Question.findById(id)
        if(!question){
            return res.status(404).json({
                success: false,
                message: "Question not found"
            })
        }
       const answers = await Answer.find({
        question: question._id
       }).populate("answeredBy", "name district")
       .sort({createdAt:-1});
       return res.status(200).json({
        success: true,
        count: answers.length,
        answers
       })
    }catch(error){
        console.error("Failed to fetch answers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const deleteAnswer = async function(req,res){
    try{
        const {id, answerId} = req.params;
         if (

            !mongoose.Types.ObjectId.isValid(id) ||

            !mongoose.Types.ObjectId.isValid(answerId)

        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid question ID or answer ID"

            });

        }
        const user = await User.findOne({
            phone: req.user.phone
        })
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const answer = await Answer.findById(answerId)
        if(!answer){
            return res.status(404).json({
                success: false,
                message: "Answer not Found"
            })
        }
        if(answer.question.toString() !== id){
            return res.status(400).json({
                success: false,
                message: "Answer Does not belong to this Question"
            })
        }
        if(answer.answeredBy.toString() !== user._id.toString()){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this answer"
            })
        }

        await Answer.findByIdAndDelete(answerId)
        return res.status(200).json({
            success: true,
            message: "Answer deleted successfully"
        })
    }catch(error){
        console.error("Failed to delete answer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const updateAnswer = async function(req,res){
    try{
    const {id, answerId} = req.params;
     if (

            !mongoose.Types.ObjectId.isValid(id) ||

            !mongoose.Types.ObjectId.isValid(answerId)

        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid question ID or answer ID"

            });

        }
    const user = await User.findOne({
        phone: req.user.phone
    })
    if(!user){
    return res.status(404).json({
        success: false,
        message: "User not found"
    });
}
    const {content} = req.body;
    if(typeof content !== "string" || !content.trim()){
    return res.status(400).json({
        success: false,
        message: "Answer content is required"
    });
}
    const answer = await Answer.findById(answerId);
    if(!answer){
        return res.status(404).json({
            success: false,
            message: "Answer not Found"
        })
    }
    if(answer.question.toString() !== id){
        return res.status(400).json({
            success: false,
            message: "Answer does not belong to this question"
        })
    }
    if(answer.answeredBy.toString() !== user._id.toString()){
        return res.status(403).json({
            success: false,
            message: "You are not authorized to update this answer"
        })
    }
    const updatedAnswer = await Answer.findByIdAndUpdate(
        answerId,
        {content: content.trim()},
        {new: true, runValidators: true}
    )
    return res.status(200).json({
        success: true,
        message: "Successfully updated your answer",
        answer: updatedAnswer
    })
}catch(error){
    console.error("Failed to update answer:", error);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
}

const getMyAnswers = async function(req,res){
    try{
        const user = await User.findOne({
            phone: req.user.phone
        })
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not Found"
            })
        }
        const answers = await Answer.find({
            answeredBy: user._id
        }).populate("answeredBy", "name district")
        .populate("question", "title description")
        .sort({createdAt: -1})
        return res.status(200).json({
            success: true,
            count: answers.length,
            answers
        })
    }catch(error){
        console.error("Failed to fetch my answers:", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const upvoteAnswer = async function(req,res){
    try{
        const {id,answerId} = req.params;
        if (

            !mongoose.Types.ObjectId.isValid(id) ||

            !mongoose.Types.ObjectId.isValid(answerId)

        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid question ID or answer ID"

            });

        }
        const user = await User.findOne({
            phone: req.user.phone
        })
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const answer = await Answer.findOne({
            _id: answerId,
            question: id
        })
        if(!answer){
            return res.status(404).json({
                success: false,
                message: "Answer not found"
            })
        }
        // Prevent users from upvoting their own answers
if (answer.answeredBy.toString() === user._id.toString()) {
    return res.status(403).json({
        success: false,
        message: "You cannot upvote your own answer"
    });
}

        const updatedAnswer = await Answer.findOneAndUpdate(
            {
            _id: answerId,
            question: id,
            upvotedBy: { $ne: user._id }
            },
            {
                $addToSet: {upvotedBy: user._id},
                $inc: {upvotes: 1}
            },
            {
                new: true
            }
        )
        if(!updatedAnswer){
            return res.status(409).json({
                success: false,
                message: "You have already upvoted this answer"
            })
        }
        return res.status(200).json({

            success: true,

            message: "Answer upvoted successfully",

            answer: updatedAnswer

        });

    }catch(error){
        console.error("Failed to upvote answer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const removeAnswerUpvote = async function(req, res) {
    try {
        const { id, answerId } = req.params;
        if (

            !mongoose.Types.ObjectId.isValid(id) ||

            !mongoose.Types.ObjectId.isValid(answerId)

        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid question ID or answer ID"

            });

        }

        const user = await User.findOne({
            phone: req.user.phone
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const answer = await Answer.findOne({
            _id: answerId,
            question: id
        });

        if (!answer) {
            return res.status(404).json({
                success: false,
                message: "Answer not found"
            });
        }

        const updatedAnswer = await Answer.findOneAndUpdate(
            {
                _id: answerId,
                question: id,
                upvotedBy: user._id
            },
            {
                $pull: { upvotedBy: user._id },
                $inc: { upvotes: -1 }
            },
            {
                new: true
            }
        );

        if (!updatedAnswer) {
            return res.status(400).json({
                success: false,
                message: "You have not upvoted this answer"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Upvote removed successfully",
            answer: updatedAnswer
        });

    } catch (error) {
        console.error("Failed to remove answer upvote:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {createAnswer, getAnswers, deleteAnswer,updateAnswer, getMyAnswers, upvoteAnswer, removeAnswerUpvote}