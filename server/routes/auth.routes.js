const express = require("express");
const { check } = require("express-validator");
const {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Register user
router.post(
  "/register",
  [
    check("username", "Username is required").not().isEmpty(),
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  register
);

// Login user
router.post(
  "/login",
  [
    check("username", "Username is required").not().isEmpty(),
    check("password", "Password is required").not().isEmpty(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  login
);

// Get current user
router.get("/me", protect, getMe);

// Update password
router.put(
  "/update-password",
  protect,
  [
    check("currentPassword", "Current password is required").not().isEmpty(),
    check("newPassword", "New password is required").not().isEmpty(),
    check("newPassword", "New password must be at least 6 characters").isLength(
      {
        min: 6,
      }
    ),
  ],
  updatePassword
);

// Update profile
router.put("/update-profile", protect, updateProfile);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.put(
  "/reset-password/:token",
  [
    check("password", "Password is required").not().isEmpty(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  resetPassword
);

module.exports = router;
