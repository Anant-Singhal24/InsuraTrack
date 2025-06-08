const Agent = require("../models/Agent");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Policy = require("../models/Policy");

// @desc    Get agent profile for current agent user
// @route   GET /api/agents/me
// @access  Private/Agent
exports.getAgentProfile = async (req, res) => {
  try {
    const agent = await Agent.findOne({ userID: req.user.id })
      .populate({
        path: "userID",
        select: "username name email",
      })
      .populate({
        path: "linkedCustomerIDs",
        populate: {
          path: "userID",
          select: "username name email",
        },
      });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get current agent's customers
// @route   GET /api/agents/me/customers
// @access  Private/Agent
exports.getAgentOwnCustomers = async (req, res) => {
  try {
    const agent = await Agent.findOne({ userID: req.user.id });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Get agent with populated customer data
    const agentWithCustomers = await Agent.findById(agent._id).populate({
      path: "linkedCustomerIDs",
      populate: {
        path: "userID",
        select: "name email username phone",
      },
    });

    res.status(200).json({
      success: true,
      count: agentWithCustomers.linkedCustomerIDs.length,
      data: agentWithCustomers.linkedCustomerIDs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get customers linked to agent
// @route   GET /api/agents/:id/customers
// @access  Private/Agent
exports.getAgentCustomers = async (req, res) => {
  try {
    // Check if current user is agent and trying to access other agent's data
    if (
      req.user.role === "agent" &&
      !(await Agent.findOne({ userID: req.user.id, _id: req.params.id }))
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this data",
      });
    }

    const agent = await Agent.findById(req.params.id).populate({
      path: "linkedCustomerIDs",
      populate: {
        path: "userID",
        select: "username name email",
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: `Agent not found with id ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      count: agent.linkedCustomerIDs.length,
      data: agent.linkedCustomerIDs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get policies for current agent
// @route   GET /api/agents/me/policies
// @access  Private/Agent
exports.getAgentOwnPolicies = async (req, res) => {
  try {
    const agent = await Agent.findOne({ userID: req.user.id });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Find all policies where the agent is assigned
    const policies = await Policy.find({ agentID: agent._id }).populate({
      path: "customerID",
      populate: {
        path: "userID",
        select: "name email username phone",
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

// @desc    Link agent to customer (self initiated)
// @route   POST /api/agents/me/link-customer/:customerId
// @access  Private/Agent
exports.linkSelfToCustomer = async (req, res) => {
  try {
    // Find the agent's profile
    const agent = await Agent.findOne({ userID: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Find customer by ID
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id ${req.params.customerId}`,
      });
    }

    // Check if already linked
    if (agent.linkedCustomerIDs.includes(customer._id)) {
      return res.status(400).json({
        success: false,
        message: "You are already linked to this customer",
      });
    }

    // Add customer to agent's linkedCustomerIDs
    agent.linkedCustomerIDs.push(customer._id);
    await agent.save();

    // Add agent to customer's linkedAgentIDs
    customer.linkedAgentIDs.push(agent._id);
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Successfully linked to customer",
      data: {
        agent: {
          id: agent._id,
          name: (await User.findById(req.user.id)).name,
        },
        customer: {
          id: customer._id,
          name: (await User.findById(customer.userID)).name,
        },
      },
    });
  } catch (error) {
    console.error("Error linking agent to customer:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete a customer and their policies (only if all policies are inactive)
// @route   DELETE /api/agents/customers/:id
// @access  Private/Agent
exports.deleteCustomer = async (req, res) => {
  try {
    // Find the agent
    const agent = await Agent.findOne({ userID: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Find the customer
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if agent is linked to this customer
    if (!agent.linkedCustomerIDs.includes(customer._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this customer",
      });
    }

    // Find all policies for this customer
    const customerPolicies = await Policy.find({ customerID: customer._id });

    // Check if any policies are active
    const activePolicies = customerPolicies.filter((policy) => policy.isActive);
    if (activePolicies.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete customer with active policies. Please deactivate all policies first.",
        activePoliciesCount: activePolicies.length,
      });
    }

    // Get the user ID associated with this customer for later deletion
    const customerUser = await User.findById(customer.userID);
    if (!customerUser) {
      return res.status(404).json({
        success: false,
        message: "Customer user account not found",
      });
    }

    // Begin deletion process
    // 1. Delete all inactive policies
    await Policy.deleteMany({ customerID: customer._id });

    // 2. Remove customer from agent's linked customers
    agent.linkedCustomerIDs = agent.linkedCustomerIDs.filter(
      (id) => id.toString() !== customer._id.toString()
    );
    await agent.save();

    // 3. Delete the customer record
    await Customer.findByIdAndDelete(customer._id);

    // 4. Delete the user account
    await User.findByIdAndDelete(customerUser._id);

    res.status(200).json({
      success: true,
      message: "Customer and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// @desc    Search customers
// @route   GET /api/agent/search-customers
// @access  Private/Agent
exports.searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 3 characters",
      });
    }

    // Find users that match the search criteria
    const users = await User.find({
      role: "customer",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    });

    // Get the user IDs
    const userIDs = users.map((user) => user._id);

    // Find customers with those user IDs
    const customers = await Customer.find({
      userID: { $in: userIDs },
    }).populate({
      path: "userID",
      select: "name email username",
    });

    // If the requester is an agent, filter out customers already linked to them
    let filteredCustomers = customers;
// this allow not to agent name 
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (agent) {
        filteredCustomers = customers.filter(
          (customer) => !agent.linkedCustomerIDs.includes(customer._id)
        );
      }
    }

    res.status(200).json({
      success: true,
      count: filteredCustomers.length,
      data: filteredCustomers,
    });
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
