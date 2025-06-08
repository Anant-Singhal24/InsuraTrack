const User = require("../models/User");
// @desc    Check if username exists
// @route   GET /api/users/check-username/:username
// @access  Public
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user with this username
    const user = await User.findOne({ username });

    // Return whether the username exists
    res.status(200).json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
