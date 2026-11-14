const User = require("../models/User")
const Question = require("../models/Question")
const uploadImage = require("../config/cloudinaryUpload.js")
const cloudinary = require("../config/cloudinary.js")

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const createQuestion = async function(req,res){
    let uploadedImages = [];
    try{
        const {title, description, crop} = req.body;
        if(
    typeof title !== "string" || !title.trim() ||
    typeof description !== "string" || !description.trim() ||
    typeof crop !== "string" || !crop.trim()
){
    return res.status(400).json({
        success: false,
        message: "Title, description and crop are required"
    })
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

        if(req.files && req.files.length>0){
           for(const file of req.files){
            const image = await uploadImage(file.buffer)
            uploadedImages.push(image)
           }
        }

        const question = await Question.create({
            title,
            description,
            crop,
            askedBy: user._id,
            district: user.district,
            images: uploadedImages
        })

        res.status(201).json({
            success: true,
            question
        })
    }catch(error){
        const cleanupResults = await Promise.allSettled(
            uploadedImages.map(function(image){
                return cloudinary.uploader.destroy(image.public_id)
            })
        )
        cleanupResults.forEach(function(result){
            if(result.status === "rejected"){
                console.error(
                    "Failed to clean up a Cloudinary image:",
                    result.reason
                )
            }
        })

        console.error("Failed to create question:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const getAllQuestions = async function(req,res){
    try{
        const {crop, district, search, page, limit,sort} = req.query;
        const pageNumber = page === undefined ? 1 : Number(page);
        const limitNumber = limit === undefined ? 10 : Number(limit);

        if(
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ){
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters"
            })
        }


        const skip = (pageNumber -1) * limitNumber;
        let filter = {};
        if(crop){
            filter.crop = crop;
        }
        if(district){
            filter.district = district;
        }
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

    const keywords = search.trim().split(/\s+/);

    const keywordFilters = keywords.map(keyword => {
        const safeKeyword = escapeRegex(keyword);

        return {
            $or: [
                { title: { $regex: safeKeyword, $options: "i" } },
                { description: { $regex: safeKeyword, $options: "i" } },
                { crop: { $regex: safeKeyword, $options: "i" } }
            ]
        };
    });

    filter.$and = keywordFilters;
}
        const allowedSorts = ["latest", "oldest", "popular"]
        if(sort && !allowedSorts.includes(sort)){
            return res.status(400).json({
                success: false,
                message: "Invalid sort Value"
            })
        }
        let sortOption = {createdAt: -1, _id: -1};
        if(sort === "oldest"){
            sortOption = {createdAt: 1, _id: 1};
        }
        if(sort === "popular"){
            sortOption = {upvotes: -1, _id: -1};
        }
        const totalQuestions = await Question.countDocuments(filter)
        const questions = await Question.find(filter)
        .populate("askedBy", "name district")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        const totalPages = Math.ceil(totalQuestions / limitNumber)
        const hasNextPage = pageNumber < totalPages;
        const hasPreviousPage = pageNumber > 1;
        res.status(200).json({
            success: true,
            count: questions.length,
            page: pageNumber,
            limit: limitNumber,
            totalQuestions,
            totalPages,
            hasNextPage,
            hasPreviousPage,
            questions
        })
}catch(error){
    console.error("Failed to fetch questions:", error);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
}

const getQuestionById = async function(req,res){
    try{
        const {id} = req.params;
        const question = await Question.findById(id)
            .populate("askedBy","name district").populate("upvotedBy","name district")
        if(!question){
            return res.status(404).json({
                success: false,
                message: "No Question Found"
            })
        }
        return res.status(200).json({
            success: true,
            question
        })
    }catch(error){
        console.error("Failed to fetch question:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const updateQuestion = async function(req,res){
    let uploadedImages = []
    let questionSaved = false;
    try{
        const { id } = req.params;
        const { title, description, crop } = req.body;

        const user = await User.findOne({
            phone: req.user.phone
        })

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const question = await Question.findById(id)

        if(!question){
            return res.status(404).json({
                success: false,
                message: "Question not found"
            })
        }

        if(question.askedBy.toString() !== user._id.toString()){
            return res.status(403).json({
                success: false,
                message: "You can update only your Question"
            })
        }
        if(title !== undefined &&
   (typeof title !== "string" || !title.trim())){
    return res.status(400).json({
        success: false,
        message: "Invalid title"
    })
}

if(description !== undefined &&
   (typeof description !== "string" || !description.trim())){
    return res.status(400).json({
        success: false,
        message: "Invalid description"
    })
}

if(crop !== undefined &&
   (typeof crop !== "string" || !crop.trim())){
    return res.status(400).json({
        success: false,
        message: "Invalid crop"
    })
}

        if(title !== undefined) question.title = title;
        if(description !== undefined) question.description = description;
        if(crop !== undefined) question.crop = crop;

        if(req.files && req.files.length>0){
            const oldImages = question.images || []

            for(const file of req.files){
                const image = await uploadImage(file.buffer)
                uploadedImages.push(image)
            }

            question.images = uploadedImages;
            await question.save()
            questionSaved = true;

            const cleanupResults = await Promise.allSettled(
                oldImages
                .filter(image=>image.public_id)
                .map(async function(image){
                    console.log("Deleting old image:", image.public_id);
                    const result = await cloudinary.uploader.destroy(image.public_id)
                    
                
                console.log(
                    "Cloudinary deletion result:",
                    image.public_id,
                    result
                )
                return result
        })
    )
            cleanupResults.forEach(function(result){
                if(result.status === "rejected"){
                    console.error(
                        "Failed to delete old Cloudinary image:",
                        result.reason
                    )
                }
            })
        }else{
            await question.save()
            questionSaved = true;
        }

        

        return res.status(200).json({
            success: true,
            message: "Question updated successfully",
            question
        })
    }catch(error){
        if(!questionSaved){
        const cleanupResults = await Promise.allSettled(
            uploadedImages.map(function(image) {
                return cloudinary.uploader.destroy(image.public_id)
        })
        )

        cleanupResults.forEach(function(result){
            if(result.status === "rejected"){
                console.error(
                    "Failed to clean up newly uploaded image:",
                    result.reason
                )
            }
        })
    }
        console.error("Failed to update question:", error);
        res.status(500).json({
            success:false,
            message: "Internal server error"
        })
    }
}

const deleteQuestion = async function(req,res){
    try{
    const { id } = req.params;
    const user = await User.findOne({
        phone: req.user.phone
    })
    if(!user){
    return res.status(404).json({
        success: false,
        message: "User not found"
    })
}
    const question = await Question.findById(id)

    if(!question){
        return res.status(404).json({
            success: false,
            message: "Question not found"
        })
    }
    if(question.askedBy.toString() !== user._id.toString()){
        return res.status(403).json({
            success: false,
            message: "You can only delete your Question"
        })
    }

    await Question.findByIdAndDelete(id);

    const images = question.images || []

    const cleanupResults = await Promise.allSettled(
        images
        .filter(image=>image.public_id)
        .map(async function(image){
            const result = await cloudinary.uploader.destroy(
                image.public_id
            )
            console.log(
                "Cloudinary deletion:",
                image.public_id,
                result.result
            )
            return result;
    })
    )

    cleanupResults.forEach(function(result){
        if(result.status === "rejected"){
            console.error(
                "Failed to delete Cloudinary image:",
                result.reason
            )
        }
    })

    res.status(200).json({
        success: true,
        message: "Successfully Deleted Question"
    })
}catch(error){
    console.error("Failed to delete question:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
}

const upvoteQuestion = async function(req,res){
    try{
    const {id} = req.params;
    const user = await User.findOne({
        phone: req.user.phone
    })
    if(!user){
    return res.status(404).json({
        success: false,
        message: "User not found"
    })
}
    const question = await Question.findOneAndUpdate({
        _id: id,
        upvotedBy: {$ne: user._id}
    },
    {
        $addToSet: {upvotedBy: user._id},
        $inc: {upvotes: 1}
    },
    {new: true});
    if(!question){
        const existingQuestion = await Question.findById(id);
        if(!existingQuestion){
        return res.status(404).json({
            success: false,
            message: "Question not Found"
        })
    }
        return res.status(409).json({
            success: false,
            message: "Already upvoted"
        })
    }
    res.status(200).json({
        success: true,
        message: "You have upvoted successfully",
        upvotes: question.upvotes
    })
}catch(error){
    console.error("Failed to upvote question:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
}

const removeUpvote = async function(req,res){
    try{
    const {id} = req.params;
    const user = await User.findOne({
        phone: req.user.phone
    })
    if(!user){
    return res.status(404).json({
        success: false,
        message: "User not found"
    })
}
    const question = await Question.findOneAndUpdate(
        {
            _id: id,
            upvotedBy: user._id
        },
        {
            $pull: {upvotedBy: user._id},
            $inc: {upvotes: -1}
        },
        {new: true}
    )
    if(!question){
        const existingQuestion = await Question.findById(id);
        if(!existingQuestion){
        return res.status(404).json({
            success: false,
            message: "Question not Found"
        })
    }
    return res.status(400).json({
            success: false,
            message: "You have not upvoted this question"
        })
    }
    return res.status(200).json({
            success: true,
            message: "Removed your Upvote",
            upvotes: question.upvotes
        })
    
}catch(error){
    console.error("Failed to remove upvote:", error);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    })
}
}

const getMyQuestions = async function(req,res){
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
        const questions = await Question.find({
            askedBy: user._id
        }).populate("askedBy", "name district")
        .sort({createdAt: -1})

        return res.status(200).json({
            success: true,
            count: questions.length,
            questions
        })
    }catch(error){
        console.error("Failed to fetch user's questions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

module.exports = {createQuestion,getAllQuestions,getQuestionById,updateQuestion,deleteQuestion,upvoteQuestion,removeUpvote, getMyQuestions}