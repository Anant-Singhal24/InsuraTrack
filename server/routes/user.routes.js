const express = require("express");
const { checkUsername } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes that don't require authentication
router.get("/check-username/:username", checkUsername);

module.exports = router;
