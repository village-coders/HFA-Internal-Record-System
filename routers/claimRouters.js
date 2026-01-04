const express = require("express")

const claimRouter = express.Router()

const {getAllClaims, createClaim, getMyClaim} = require("../controllers/claimController")
const isLoggedIn = require("../middlewares/isLoggedIn")
const upload = require("../middlewares/upload")



claimRouter.post("/create", upload.fields([
  { name: "file1", maxCount: 1 },
  { name: "file2", maxCount: 1 },
  { name: "file3", maxCount: 1 },
  { name: "file4", maxCount: 1 },
  { name: "file5", maxCount: 1 }
]), isLoggedIn, createClaim)

claimRouter.get("/all", getAllClaims)

claimRouter.get("/my-claim", isLoggedIn, getMyClaim)


module.exports = claimRouter