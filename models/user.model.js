const mongoose = require("mongoose");
const uuid = require("uuid");
const { Schema } = mongoose;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const UserSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuid.v4(),
    },
    name: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String
    },
    phone: {
      type: Number,
      unique: true
    },
    photo: {
      type: String
    },
    refreshToken: {
        type: String
    },
  },
  {
    timestamps: {
      createdAt: "_created_at",
      updatedAt: "_updated_at",
    },
    versionKey: false,
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.createUser = async function (userDetails) {
  try {
    const data = new this(userDetails);
    return data.save();
  } catch (error) {
    throw new Error(`Error saving message: ${error.message}`);
  }
};

UserSchema.methods.generateToken = function () {
  const payload = {
    user: {
      name: this.name,
      id: this._id,
      isAdmin: this.isAdmin,
      isPublic: this.isPublic
    },
  };
  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
  return token;
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", UserSchema, "User");
module.exports = { User };
