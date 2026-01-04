// const bcrypt = require("bcryptjs")
// const jwt = require("jsonwebtoken")
// const userModel = require("../models/User")

// //Signup
// const signup = async (req, res, next)=>{
//     const {password} = req.body
//     try {
//         const salt = await bcrypt.genSalt(10)
//         const hashedPassword = await bcrypt.hash(password, salt)

//         // const userId = "HFA" + Math.floor(Math.random() * 1000000) 

//         const user = await userModel.create({...req.body, password: hashedPassword, userId})

//         if(!user){
//            return res.status(404).json({
//                 status: "error",
//                 message: "could not sign up"
//             })
//         }

//         res.status(202).json({
//             status: "success",
//             message: "User created successful.",
//             user
//         })

//     } catch (error) {
//         console.log(error)
//         next(error)      
//     }
// }



// //Login
// const login = async (req, res, next) => {
//     const { userId, password } = req.body;

//     try {
//         if (!userId || !password) {
//             return res.status(400).json({
//                 status: "error",
//                 message: "UserId and password are required"
//             });
//         }

//         const user = await userModel.findOne({ email });

//         if (!user || !user.password) {
//             return res.status(401).json({
//                 status: "error",
//                 message: "UserId or password is incorrect"
//             });
//         }

//         const passwordCorrect = await bcrypt.compare(userId, user.userId);
//         if (!passwordCorrect) {
//             return res.status(401).json({
//                 status: "error",
//                 message: "Email or password is incorrect"
//             });
//         }

//         const accessToken = jwt.sign(
//             { id: user._id, name: user.name, email: user.email },
//             process.env.jwt_secret,
//             { expiresIn: process.env.jwt_exp }
//         );

//         const userData = {
//             _id: user._id,
//             name: user.claimantName,
//             email: user.email,
//             role: user.role,
//             userId: user.userId
//         };

//         res.status(200).json({
//             status: "success",
//             message: "Login successful. Welcome back!",
//             accessToken,
//             user: userData
//         });
//     } catch (error) {
//         console.log(error);
//         next(error);
//     }
// };

// // PUT /users/update-password/:id

// const updateUserPassword = async (req, res, next) => {
//   const { id } = req.params;
  
//   const { currentPassword, newPassword } = req.body;

//   try {
//     const user = await userModel.findById(id);
//     if (!user) {
//       return res.status(404).json({ status: 'error', message: 'User not found' });
//     }

//     const isMatch = await bcrypt.compare(currentPassword, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
//     }
//     const salt = await bcrypt.genSalt(10)
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
//     user.password = hashedPassword;
//     await user.save();

//     res.status(200).json({ status: 'success', message: 'Password updated successfully' });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// };


// const getUserById = async (req, res, next) => {
//     const {id} = req.params

//     try {
//         const user = await userModel.findById(id)

//         if(!user){
//             return res.status(404).json({
//                 status: 'error',
//                 message: "User not found"
//             })
//         }

//         res.status(200).json({
//             status: "success",
//             message: "User found",
//             data: user
//         })
//     } catch (error) {
//         console.log(error)
//         next(error)
//     }
// }

// module.exports = {
//     signup,
//     login,
//     updateUserPassword,
//     getUserById
// }