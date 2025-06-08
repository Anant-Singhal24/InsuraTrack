const express = require("express");
const {
  sendMessage,
  getAgentMessages,
  markMessageAsRead,
  sendReply,
  getConversationWithAgent,
  deleteMessage,
} = require("../controllers/message.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for customers
router.post("/", authorize("customer"), sendMessage);
router.get(
  "/conversation/:agentId",
  authorize("customer"),
  getConversationWithAgent
);
router.delete("/:id", authorize("customer", "agent"), deleteMessage);

// Routes for agents
router.get("/agent", authorize("agent"), getAgentMessages);
router.put("/:id/read", authorize("agent"), markMessageAsRead);
router.post("/reply/:id", authorize("agent"), sendReply);

module.exports = router;
