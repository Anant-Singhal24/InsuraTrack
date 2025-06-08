const Message = require("../models/Message");
const Customer = require("../models/Customer");
const Agent = require("../models/Agent");

// @desc    Send message from customer to agent
// @route   POST /api/messages
// @access  Private/Customer
exports.sendMessage = async (req, res) => {
  try {
    const { agentId, subject, message, senderRole } = req.body;

    if (!agentId || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if agent exists
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // Find customer by current user ID
    const customer = await Customer.findOne({ userID: req.user.id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Create new message
    const newMessage = new Message({
      customerId: customer._id,
      agentId,
      subject,
      message,
      senderRole: senderRole || "customer", // Use provided role or default to customer
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get messages for an agent
// @route   GET /api/messages/agent
// @access  Private/Agent
exports.getAgentMessages = async (req, res) => {
  try {
    // Find agent by current user ID
    const agent = await Agent.findOne({ userID: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Get messages for this agent, but only the original messages (not replies)
    const messages = await Message.find({
      agentId: agent._id,
      replyTo: null, // Only get parent messages
    })
      .populate({
        path: "customerId",
        populate: {
          path: "userID",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1 }); // Most recent first

    // For each message, get its replies
    const messagesWithReplies = await Promise.all(
      messages.map(async (message) => {
        const replies = await Message.find({ replyTo: message._id }).sort({
          createdAt: 1,
        });
        const messageObj = message.toObject();
        messageObj.replies = replies;
        return messageObj;
      })
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messagesWithReplies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private/Agent
exports.markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Find agent by current user ID
    const agent = await Agent.findOne({ userID: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Check if message belongs to this agent
    if (message.agentId.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this message",
      });
    }

    // Update message
    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Send reply from agent to customer
// @route   POST /api/messages/reply/:id
// @access  Private/Agent
exports.sendReply = async (req, res) => {
  try {
    const { message } = req.body;
    const originalMessageId = req.params.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message",
      });
    }

    // Find the original message
    const originalMessage = await Message.findById(originalMessageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    // Find agent by current user ID
    const agent = await Agent.findOne({ userID: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Check if agent is authorized to reply (is it their message?)
    if (originalMessage.agentId.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reply to this message",
      });
    }

    // Create new reply message
    const newReply = new Message({
      customerId: originalMessage.customerId,
      agentId: agent._id,
      subject: `Re: ${originalMessage.subject}`,
      message,
      replyTo: originalMessage._id,
      senderRole: "agent",
    });

    await newReply.save();

    res.status(201).json({
      success: true,
      data: newReply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get conversation between customer and agent
// @route   GET /api/messages/conversation/:agentId
// @access  Private/Customer
exports.getConversationWithAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId;

    // Find customer by current user ID
    const customer = await Customer.findOne({ userID: req.user.id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Check if agent exists
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // Get all messages between this customer and agent (both original messages and replies)
    const messages = await Message.find({
      customerId: customer._id,
      agentId: agentId,
    }).sort({ createdAt: 1 }); // Sort by creation time ascending (oldest first)

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete message and its replies
// @route   DELETE /api/messages/:id
// @access  Private/Agent or Customer (depends on role and ownership)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check authorization based on user role
    if (req.user.role === "agent") {
      // Find agent by current user ID
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent profile not found",
        });
      }

      // Check if message belongs to this agent
      if (message.agentId.toString() !== agent._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this message",
        });
      }
    } else if (req.user.role === "customer") {
      // Find customer by current user ID
      const customer = await Customer.findOne({ userID: req.user.id });
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      // Check if message belongs to this customer
      if (message.customerId.toString() !== customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this message",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete messages",
      });
    }

    // Delete all replies to this message
    await Message.deleteMany({ replyTo: message._id });

    // Delete the main message using findByIdAndDelete instead of remove()
    await Message.findByIdAndDelete(message._id);

    res.status(200).json({
      success: true,
      message: "Message and replies deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
