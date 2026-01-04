const mongoose = require("mongoose")
const { defaultMaxListeners } = require("nodemailer/lib/xoauth2")

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    claimantName: {
        type: String,
        required: true
    },
    phoneNo: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    registeredDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    roles: {
        type: String,
        enum: ["staff", "financial officer", "ceo", "accountant", "admin", "chairman"],
        default: "staff"
    }

}, {timestamps: true})


const userModel = mongoose.model("user", userSchema)

module.exports = userModel