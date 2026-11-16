const express = require("express");
const { check } = require("express-validator");
const rateLimit = require("express-rate-limit");
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

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window
  message: { success: false, message: "Too many attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // max 5 requests per window
  message: { success: false, message: "Too many password reset requests, please try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register user
router.post(
  "/register",
  authLimiter,
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
  authLimiter,
  [
    check("username", "Username or email is required").custom(
      (value, { req }) => Boolean(req.body.username || req.body.email)
    ),
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
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

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
