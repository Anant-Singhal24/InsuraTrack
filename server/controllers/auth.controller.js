const crypto = require("crypto"); // core module(doesnot want to add in package.json)
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Agent = require("../models/Agent");
const Customer = require("../models/Customer");
const sendEmail = require("../utils/sendEmail");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, name, email, password, role } = req.body;

    // Check if username exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already in use by another account",
      });
    }

    // Create user
    const user = await User.create({
      username,
      name,
      email,
      password,
      role: role || "agent", // Default to agent if no role specified
    });

    // Create role-specific record
    if (user.role === "agent") {
      await Agent.create({ userID: user._id });
    } else if (user.role === "customer") {
      await Customer.create({ userID: user._id });
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { username, password } = req.body;
    // console.log("Login attempt for username:", username);

    // Check for user
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      // console.log("No user found with username:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // console.log("User found, ID:", user._id, "Username:", user.username);

    // Find by ID to verify we have the right user
    // console.log("Checking for consistency in user ID lookup");
    const userById = await User.findById(user._id).select("+password");
    if (!userById) {
      // console.log("Warning: Could not find user by ID. This is unexpected.");
    } else {
      // console.log("Found by ID:", userById._id, "Username:", userById.username);
    }

    // Check if password matches
    // console.log(
    //   "Password hash in DB:",
    //   user.password ? user.password.substring(0, 10) + "..." : "Not available"
    // );
    const isMatch = await user.matchPassword(password); // using this defined in User model
    // console.log("Password match result:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // console.log("Login successful for user:", user._id);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log("Forgot password request for email:", email);

    const user = await User.findOne({ email });
    if (!user) {
      // console.log("No user found with that email");
      return res.status(404).json({
        success: false,
        message: "No user with that email",
      });
    }

    // console.log("User found for password reset:", user._id);
    // console.log("Username:", user.username);

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();
    // console.log("Reset token saved for user:", user._id);

    // Create reset url
    const resetUrl = `${
      process.env.CLIENT_URL || "http://localhost:3001"
    }/reset-password/${resetToken}`;

    const message = `
      <h1>You requested a password reset</h1>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "InsuraTrack Password Reset",
        message,
      });

      res.status(200).json({
        success: true,
        message:
          "Email sent. Check your inbox (or spam folder) for reset instructions.",
        // For development, provide the token directly so testing is easier
        ...(process.env.NODE_ENV !== "production" && { resetToken }),
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
        error:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    // console.log(
    //   "Reset password request received with token:",
    //   req.params.token
    // );
    // console.log("New password received:", req.body.password ? "Yes" : "No");

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // console.log("Looking for user with token:", resetPasswordToken);

    // Find user with token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      // console.log("No user found with valid token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // console.log("User found:", user._id);
    // console.log("Username:", user.username);

    // Double-check to make sure we have the correct user
    const userByUsername = await User.findOne({ username: user.username });
    if (
      userByUsername &&
      userByUsername._id.toString() !== user._id.toString()
    ) {
      // console.log(
      //   "Found different user ID with same username! Using:",
      //   userByUsername._id
      // );
      // We'll use this user instead
      user._id = userByUsername._id;
    }

    // Generate salt and hash password manually
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // console.log("Password hashed manually");

    // Update user with findOneAndUpdate to bypass middleware issues
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpire: undefined,
        },
      },
      { new: true }
    );

    // console.log(
    //   "User password updated successfully with direct update for ID:",
    //   updatedUser._id
    // );

    sendTokenResponse(updatedUser, 200, res);
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Check if email is already in use by another user
    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another account",
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    // Update user
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken(); // defined in user model

  // console.log("Sending token response for user:", user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};
