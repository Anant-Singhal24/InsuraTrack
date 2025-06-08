const Customer = require("../models/Customer");
const User = require("../models/User");
const Agent = require("../models/Agent");
const Policy = require("../models/Policy");


// @desc    Create new customer
// @route   POST /api/customers
// @access  Private/Agent
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, username, password, phone } = req.body;

    // Check if required fields are provided
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, username, and password",
      });
    }

    // Check if user with same email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create a new user
    const user = await User.create({
      name,
      email,
      username,
      password, // Password will be hashed in the User model's pre-save middleware
      role: "customer",
      phone,
    });

    // Create a new customer profile
    const customer = await Customer.create({
      userID: user._id,
      linkedAgentIDs: [],
    });

    // If request is made by an agent, link the customer to that agent
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });

      if (agent) {
        // Add agent to customer's linkedAgentIDs
        customer.linkedAgentIDs.push(agent._id);
        await customer.save();

        // Add customer to agent's linkedCustomerIDs
        agent.linkedCustomerIDs.push(customer._id);
        await agent.save();
      }
    }

    res.status(201).json({
      success: true,
      data: {
        customer,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private/Agent (if linked)
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate({
        path: "userID",
        select: "username name email phone",
      })
      .populate({
        path: "linkedAgentIDs",
        populate: {
          path: "userID",
          select: "username name email phone",
        },
      })
      .populate("policyIDs");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id ${req.params.id}`,
      });
    }

    // Check if agent is authorized to access this customer
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !agent.linkedCustomerIDs.includes(customer._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this customer",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get customer profile for current customer user
// @route   GET /api/customers/me
// @access  Private/Customer
exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userID: req.user.id })
      .populate({
        path: "userID",
        select: "username name email phone",
      })
      .populate({
        path: "linkedAgentIDs",
        populate: {
          path: "userID",
          select: "username name email phone",
        },
      })
      .populate("policyIDs");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get customer's policies
// @route   GET /api/customers/:id/policies
// @access  Private/Agent (if linked), or Customer (if self)
exports.getCustomerPolicies = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id ${req.params.id}`,
      });
    }

    // Check authorization
    if (
      req.user.role === "customer" &&
      req.user.id !== customer.userID.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access these policies",
      });
    }

    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !agent.linkedCustomerIDs.includes(customer._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access these policies",
        });
      }
    }

    const policies = await Policy.find({ customerID: customer._id }).populate({
      path: "agentID",
      populate: {
        path: "userID",
        select: "name",
      },
    });

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Agent (if linked)
exports.updateCustomer = async (req, res) => {
  try {
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id ${req.params.id}`,
      });
    }

    // Check if agent is authorized to update this customer
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !agent.linkedCustomerIDs.includes(customer._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this customer",
        });
      }
    }

    // Update user info
    if (req.body.name || req.body.email || req.body.phone !== undefined) {
      await User.findByIdAndUpdate(
        customer.userID,
        {
          ...(req.body.name && { name: req.body.name }),
          ...(req.body.email && { email: req.body.email }),
          ...(req.body.phone !== undefined && { phone: req.body.phone }),
        },
        { runValidators: true, new: true }
      );
    }

    // Get updated customer data
    const updatedCustomer = await Customer.findById(req.params.id).populate({
      path: "userID",
      select: "username name email phone",
    });

    res.status(200).json({
      success: true,
      data: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
