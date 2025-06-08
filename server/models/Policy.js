const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide policy title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide policy description"],
    },
    policyNumber: {
      type: String,
      required: [true, "Please provide policy number"],
      trim: true,
      unique: true,
    },
    mobileNo: {
      type: String,
      required: [true, "Please provide contact mobile number"],
      trim: true,
    },
    sumAssured: {
      type: Number,
      required: [true, "Please provide sum assured amount"],
    },
    companyName: {
      type: String,
      required: [true, "Please select insurance company"],
      enum: [
        "HDFC ERGO",
        "HDFC LIFE",
        "LIC",
        "STAR HEALTH",
        "CARE HEALTH",
        "OTHER",
      ],
      default: "OTHER",
    },
    premium: {
      type: Number,
      required: [true, "Please provide premium amount"],
    },
    startDate: {
      type: Date,
      required: [true, "Please provide policy start date"],
      default: Date.now,
    },
    renewalDate: {
      type: Date,
      required: [true, "Please provide policy renewal date"],
    },
    documentFile: {
      data: Buffer,
      contentType: String,
    },
    documentName: {
      type: String,
      default: null, // Original filename of the document
    },
    documentUploadDate: {
      type: Date,
      default: null, // Date when document was uploaded
    },
    customerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    agentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRenewalDate: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Policy", PolicySchema);
