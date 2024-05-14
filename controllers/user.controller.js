const bcrypt = require("bcrypt");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const { User } = require("../models/user.model.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const body = req.body;
    const existedUser = await User.findOne({
      $or: [{ phone: body.phone }, { email: body.email }],
    });
    if (existedUser) {
      throw new ApiError(409, "User with email or name already exists");
    }
    const imageLocalPath = req.files?.photo[0]?.path;
    const userImage = await uploadOnCloudinary(imageLocalPath)
    if (!userImage) {
      throw new ApiError(400, "Image file is required")
    }
    if (userImage && userImage.url) {
      body.photo = userImage.url
    } 
    const createUser = await User.create(body);
    const createdUser = await User.findById(createUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      throw new ApiError(400, "email and password is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

const updateUserDetails = asyncHandler(async (req, res) => {
  try {
    const { name, email, photo, bio, phone, password } = req.body;
    if (!name || !email || !photo || !bio || !phone || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const imageLocalPath = req.files?.photo[0]?.path;
    const userImage = await uploadOnCloudinary(imageLocalPath)
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        $set: {
          name,
          email,
          photo: userImage.url,
          bio,
          phone,
          password: encryptedPassword,
        },
      },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User details updated successfully"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isPublic: req.body.isPublic },
      { new: true }
    );
    if (!user) {
      throw new ApiError(400, "User not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User profile updated successfully"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new ApiError(400, "User not found");
    }
    if (user && (user.isPublic || req.user.isAdmin)) {
      return res.status(200).json(new ApiResponse(200, user, "success"));
    } else {
      throw new ApiError(403, "Access forbidden");
    }
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

const getAllProfile = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    if (users && users.length) {
      return res.status(200).json(new ApiResponse(200, users, "success"));
    }
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong"
    );
  }
});

module.exports = {
  registerUser,
  loginUser,
  updateUserDetails,
  updateProfile,
  getUserProfile,
  getAllProfile,
  logoutUser,
};
