const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateProfile,
  getAllProfile,
  updateUserDetails,
} = require("../controllers/user.controller");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const router = express.Router();
const { validate } = require("../middlewares/validation.middleware.js");
const { requestSchema } = require("../enums/requestValidate.enums.js");
const { upload } = require("../middlewares/multer.middleware.js");
const GoogleAuthService = require('../services/google.auth.service.js');

const googleAuthService = new GoogleAuthService();

router.post(
  "/register",
  validate(requestSchema),
  upload.fields([
    {
      name: "photo",
      maxCount: 1,
    }
  ]),
  registerUser
); // Register a new account

router.post("/login", loginUser); // Log In
router.post("/logout", logoutUser); // Log Out
router.put("/profile/:userId", verifyJWT, updateProfile); // Set profile as public or private
router.get("/userProfile/:userId", verifyJWT, getUserProfile); // Get user profile
router.get("/allUsers", verifyJWT, getAllProfile); // Admin access to all profiles
router.put("/updateUser/:userId", verifyJWT, updateUserDetails); // Update user details

router.get('/auth/google', googleAuthService.authenticateGoogle);
router.get('/auth/google/callback', googleAuthService.handleGoogleCallback);

module.exports = { router };
