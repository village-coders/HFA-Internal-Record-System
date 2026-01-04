const mongoose = require("mongoose")

const claimSchema = new mongoose.Schema({
    claimantName: {
        type: String,
        required: true
    },
    claimType: {
        type: String,
        required: true
    },
    claimReferenceNo: {
        type: String,
        required: true
    },
    roles: {
        type: String,
        enum: ["submitted", "approved", "further approval", "paid"],
        default: "submitted"
    },  
    companyName: {
        type: String,
        required: true
    },
    contactPerson: {
        type: String
    },
    contactEmail: {
        type: String
    },
    
    file1: {type: String},
    file2: {type: String},
    file3: {type: String},
    file4: {type: String},
    file5: {type: String},

    date: {type: Date}
}, {timestamps: true})

const claimModel = mongoose.model("claim", claimSchema)

module.exports = claimModel