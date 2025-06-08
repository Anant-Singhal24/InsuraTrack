const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Please provide your full name"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["agent", "customer"],
    default: "customer",
  },
  phone: {
    type: String,
    default: "",
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isPasswordReset: Boolean,
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  try {
    // console.log(
    //   "Pre-save hook triggered. Password modified:",
    //   this.isModified("password")
    // );
    // console.log("isPasswordReset flag:", this.isPasswordReset);

    // Skip hashing if this is a password reset (we already hashed it manually)
    if (this.isPasswordReset === true) {
      // console.log("Skipping hash because isPasswordReset is true");
      // Reset the flag for future saves
      this.isPasswordReset = undefined;
      return next();
    }

    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
      return next();
    }

    // console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // console.log("Password hashed successfully");
    return next();
  } catch (error) {
    console.error("Error hashing password:", error);
    return next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // console.log("Matching password for user:", this._id);
  // console.log(
  //   "Password hash in DB:",
  //   this.password ? this.password.substring(0, 10) + "..." : "Not available"
  // );

  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    // console.log("bcrypt compare result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function () {
  //essential for user authentication
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || "insuratrack_default_secret_key",
    { expiresIn: process.env.JWT_EXPIRE || "30d" }
  );
};

module.exports = mongoose.model("User", UserSchema);
