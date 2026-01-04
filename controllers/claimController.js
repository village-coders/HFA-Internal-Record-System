const claimModel = require("../models/claim")
const uploadToSupabase = require("../utils/uploadToSupabase")


const createClaim = async(req, res, next) => {
    const files = req.files
    try {

        const file1 = await uploadToSupabase(files.file1[0], "file1");
        const file2 = await uploadToSupabase(files.file2[0], "file2");
        const file3 = await uploadToSupabase(files.file3[0], "file3");
        const file4 = await uploadToSupabase(files.file4[0], "file4");
        const file5 = await uploadToSupabase(files.file5[0], "file5");
        
        const claim = claimModel.create({...req.body, createdBy: req.user.id, file1, file2, file3, file4, file5})

        if(!claim){
            res.status(400).json({
                status: "error",
                message: "Failed to create claim"
            })
        }


        res.status(201).json({
            status: "success",
            message: "Claim created successfully",
            data: claim
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const getMyClaim = async(req, res, next) => {
    try {
        const claim = claimModel.find(req.user.id)

        if(!claim || claim.length === 0){
            res.status(404).json({
                status: "success",
                message: "You have no claim",
                data: []
            })
        }

        res.status(200).json({
            status: "success",
            message: "Claim fetch successfully",
            data: claim
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}


const getAllClaims = async(req, res, next) => {
    try {
        const claim = claimModel.find()

        if(!claim || claim.length === 0){
            res.status(404).json({
                status: "success",
                message: "No claim found",
                data: []
            })
        }

        res.status(200).json({
            status: "success",
            message: "Claim fetch successfully",
            data: claim
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}




module.exports = {
    createClaim,
    getMyClaim,
    getAllClaims
}