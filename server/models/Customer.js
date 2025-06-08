const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  linkedAgentIDs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
  ],
  policyIDs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Customer", CustomerSchema);
