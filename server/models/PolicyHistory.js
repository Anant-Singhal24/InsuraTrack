const mongoose = require("mongoose");

const PolicyHistorySchema = new mongoose.Schema({
  policyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  premium: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  renewalDate: {
    type: Date,
    required: true,
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
  policyNumber: {
    type: String,
    trim: true,
  },
  mobileNo: {
    type: String,
    trim: true,
  },
  sumAssured: {
    type: Number,
  },
  companyName: {
    type: String,
    trim: true,
  },
  changeType: {
    type: String,
    enum: ["renewal", "update", "create"],
    default: "update",
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PolicyHistory", PolicyHistorySchema);
