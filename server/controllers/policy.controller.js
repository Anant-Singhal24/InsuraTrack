const Policy = require("../models/Policy");
const PolicyHistory = require("../models/PolicyHistory");
const Customer = require("../models/Customer");
const Agent = require("../models/Agent");

// @desc    Get single policy by ID
// @route   GET /api/policies/:id
// @access  Private/Agent (if linked), Customer (if their policy)
exports.getPolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate({
        path: "customerID",
        populate: {
          path: "userID",
          select: "username name email",
        },
      })
      .populate({
        path: "agentID",
        populate: {
          path: "userID",
          select: "username name email",
        },
      });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this policy",
        });
      }
    } else if (req.user.role === "customer") {
      const customer = await Customer.findOne({ userID: req.user.id });
      if (!customer || !policy.customerID.equals(customer._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this policy",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Create policy
// @route   POST /api/policies
// @access  Private/Agent
exports.createPolicy = async (req, res) => {
  try {
    const {
      title,
      description,
      premium,
      startDate,
      renewalDate,
      customerID,
      policyNumber,
      mobileNo,
      sumAssured,
      companyName,
    } = req.body;

    // Check if policy number already exists
    const existingPolicy = await Policy.findOne({ policyNumber });
    if (existingPolicy) {
      return res.status(400).json({
        success: false,
        message: `Policy number ${policyNumber} already exists. Please use a unique policy number.`,
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerID);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id ${customerID}`,
      });
    }

    // Get agent ID based on user role
    let agentID;

    // Use agent's ID
    const agent = await Agent.findOne({ userID: req.user.id });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      });
    }

    // Check if agent is linked to customer
    if (!agent.linkedCustomerIDs.some((id) => id.toString() === customerID)) {
      // If not linked, try to establish the link now
      // console.log(
      //   `Agent ${agent._id} attempting to link with customer ${customerID}`
      // );

      try {
        // Add customer to agent's linkedCustomerIDs
        agent.linkedCustomerIDs.push(customerID);
        await agent.save();

        // Add agent to customer's linkedAgentIDs
        customer.linkedAgentIDs.push(agent._id);
        await customer.save();

        // console.log(
        //   `Successfully linked agent ${agent._id} to customer ${customerID}`
        // );
      } catch (linkError) {
        console.error(`Error linking agent to customer: ${linkError.message}`);
        return res.status(403).json({
          success: false,
          message:
            "You are not linked to this customer and automatic linking failed. Please link to the customer first.",
        });
      }
    }

    agentID = agent._id;

    // Create policy with new fields
    const policy = await Policy.create({
      title,
      description,
      premium,
      startDate,
      renewalDate,
      customerID,
      agentID,
      policyNumber,
      mobileNo,
      sumAssured,
      companyName,
    });

    // Add policy to customer's policies
    customer.policyIDs.push(policy._id);
    await customer.save();

    res.status(201).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error("Error creating policy:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update policy
// @route   PUT /api/policies/:id
// @access  Private/Agent (if their customer)
exports.updatePolicy = async (req, res) => {
  try {
    let policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization for agent
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this policy",
        });
      }
    }

    // Check if policy number is being changed and if so, ensure it's unique
    if (
      req.body.policyNumber &&
      req.body.policyNumber !== policy.policyNumber
    ) {
      const existingPolicy = await Policy.findOne({
        policyNumber: req.body.policyNumber,
      });
      if (existingPolicy) {
        return res.status(400).json({
          success: false,
          message: `Policy number ${req.body.policyNumber} already exists. Please use a unique policy number.`,
        });
      }
    }

    // Update the policy using updateOne for specific fields
    const updateData = {};

    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.premium) updateData.premium = req.body.premium;
    if (req.body.startDate) updateData.startDate = req.body.startDate;
    if (req.body.renewalDate) updateData.renewalDate = req.body.renewalDate;

    // Handle the toggle status flag or direct isActive updates
    if (req.toggleStatus) {
      // Toggle the current value
      updateData.isActive = !policy.isActive;
    } else if (req.body.isActive !== undefined) {
      // Set to the provided value
      updateData.isActive = req.body.isActive;
    }

    // Add new fields to updateData
    if (req.body.policyNumber) updateData.policyNumber = req.body.policyNumber;
    if (req.body.mobileNo) updateData.mobileNo = req.body.mobileNo;
    if (req.body.sumAssured)
      updateData.sumAssured = parseFloat(req.body.sumAssured);
    if (req.body.companyName) updateData.companyName = req.body.companyName;

    // Use updateOne as specified in requirements
    await Policy.updateOne({ _id: req.params.id }, { $set: updateData });

    // Get updated policy
    const updatedPolicy = await Policy.findById(req.params.id);

    // Custom message for status toggle
    const message = req.toggleStatus
      ? `Policy status updated to ${
          updateData.isActive ? "active" : "inactive"
        }`
      : "Policy updated successfully";

    res.status(200).json({
      success: true,
      message,
      data: updatedPolicy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete policy
// @route   DELETE /api/policies/:id
// @access  Private/gent (if their policy)
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization for agent
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this policy",
        });
      }
    }

    // Remove policy from customer's policies array
    const customer = await Customer.findById(policy.customerID);
    if (customer) {
      customer.policyIDs = customer.policyIDs.filter(
        (id) => id.toString() !== policy._id.toString()
      );
      await customer.save();
    }

    // Remove policy using findByIdAndDelete instead of remove()
    await Policy.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Upload document for a policy
// @route   POST /api/policies/:id/document
// @access  Private/Agent (if their policy)
exports.uploadPolicyDoc = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF document",
      });
    }

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization for agent
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this policy",
        });
      }
    }

    // Check if this is an update or new document
    const isReplacing = policy.documentFile && policy.documentFile.data;

    // if (isReplacing) {
    //   console.log(
    //     `Replacing document for policy: ${policy._id}, old document name: "${policy.documentName}"`
    //   );
    // } else {
    //   console.log(`Creating new document for policy: ${policy._id}`);
    // }

    // Store file data directly in MongoDB
    policy.documentFile = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
    policy.documentName = req.file.originalname;
    policy.documentUploadDate = Date.now();

    await policy.save();

    // console.log(
    //   `Document ${
    //     isReplacing ? "replaced" : "uploaded"
    //   } successfully for policy: ${policy._id}`
    // );

    res.status(200).json({
      success: true,
      data: {
        documentId: policy._id,
        documentName: policy.documentName,
        documentUploadDate: policy.documentUploadDate,
        wasReplaced: isReplacing,
        hasDocument: true,
      },
      message: isReplacing
        ? "Document replaced successfully"
        : "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get policy document information
// @route   GET /api/policies/:id/document
// @access  Private/Agent (if linked), Customer (if their policy)
exports.getPolicyDocument = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this policy's document",
        });
      }
    } else if (req.user.role === "customer") {
      const customer = await Customer.findOne({ userID: req.user.id });
      if (!customer || !policy.customerID.equals(customer._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this policy's document",
        });
      }
    }

    // Check if the policy has a document
    if (!policy.documentFile || !policy.documentFile.data) {
      return res.status(404).json({
        success: false,
        message: "This policy does not have an attached document",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        documentId: policy._id,
        documentName: policy.documentName,
        documentUploadDate: policy.documentUploadDate,
        hasDocument: true,
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

// @desc    Download policy document file
// @route   GET /api/policies/:id/document/download
// @access  Private/Agent (if linked), Customer (if their policy)
exports.downloadPolicyDocument = async (req, res) => {
  try {
    // console.log(
    //   `Download request for policy: ${req.params.id}, user: ${req.user.id}, role: ${req.user.role}`
    // );

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      // console.log(`Policy not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent) {
        // console.log(`Agent profile not found for user: ${req.user.id}`);
        return res.status(403).json({
          success: false,
          message: "Agent profile not found",
        });
      }

      if (!policy.agentID.equals(agent._id)) {
        // console.log(
        //   `Agent ${agent._id} not authorized for policy ${policy._id}`
        // );
        return res.status(403).json({
          success: false,
          message: "Not authorized to download this policy's document",
        });
      }
    } else if (req.user.role === "customer") {
      const customer = await Customer.findOne({ userID: req.user.id });
      if (!customer) {
        // console.log(`Customer profile not found for user: ${req.user.id}`);
        return res.status(403).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      if (!policy.customerID.equals(customer._id)) {
        // console.log(
        //   `Customer ${customer._id} not authorized for policy ${policy._id}`
        // );
        return res.status(403).json({
          success: false,
          message: "Not authorized to download this policy's document",
        });
      }
    }

    // Check if the policy has a document
    if (!policy.documentFile || !policy.documentFile.data) {
      // console.log(`No document found for policy: ${policy._id}`);
      return res.status(404).json({
        success: false,
        message: "This policy does not have an attached document",
      });
    }

    // console.log(`Successfully serving document for policy: ${policy._id}`);

    // Set response headers for file download
    res.set({
      "Content-Type": policy.documentFile.contentType,
      "Content-Disposition": `attachment; filename="${
        policy.documentName || "policy-document.pdf"
      }"`,
      "Content-Length": policy.documentFile.data.length,
    });

    // Send the file data
    return res.send(policy.documentFile.data);
  } catch (error) {
    // console.error(`Error downloading document: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Renew policy
// @route   POST /api/policies/:id/renew
// @access  Private/Agent (if their policy)
exports.renewPolicy = async (req, res) => {
  try {
    // Find the policy to renew
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization for agent
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to renew this policy",
        });
      }
    }

    // Extract renewal data
    const { newPremium, newRenewalDate, notes } = req.body;

    if (!newRenewalDate) {
      return res.status(400).json({
        success: false,
        message: "New renewal date is required",
      });
    }

    // Save the current policy details to history
    const historyRecord = new PolicyHistory({
      policyID: policy._id,
      title: policy.title,
      description: policy.description,
      premium: policy.premium,
      startDate: policy.startDate,
      renewalDate: policy.renewalDate,
      customerID: policy.customerID,
      agentID: policy.agentID,
      policyNumber: policy.policyNumber,
      mobileNo: policy.mobileNo,
      sumAssured: policy.sumAssured,
      companyName: policy.companyName,
      changeType: "renewal",
      changedBy: req.user.id,
      notes:
        notes || `Policy renewed on ${new Date().toISOString().split("T")[0]}`,
    });

    await historyRecord.save();

    // Update the policy with new data
    // The old renewal date becomes the new start date
    const updateData = {
      startDate: policy.renewalDate,
      renewalDate: new Date(newRenewalDate),
      lastRenewalDate: new Date(), // Set the lastRenewalDate to the current date
      isActive: true, // Ensure the renewed policy is active
    };

    // Update premium if provided
    if (newPremium) {
      updateData.premium = parseFloat(newPremium);
    }

    // Update the policy
    await Policy.updateOne({ _id: req.params.id }, { $set: updateData });

    // Get the updated policy
    const updatedPolicy = await Policy.findById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Policy renewed successfully",
      data: {
        policy: updatedPolicy,
        historyRecord,
      },
    });
  } catch (error) {
    console.error("Error renewing policy:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get policy history
// @route   GET /api/policies/:id/history
// @access  Private/Agent (if their policy)
exports.getPolicyHistory = async (req, res) => {
  try {
    // Find the policy
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy not found with id ${req.params.id}`,
      });
    }

    // Check authorization for agent
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent || !policy.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this policy's history",
        });
      }
    }

    // Get policy history
    const history = await PolicyHistory.find({ policyID: policy._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "changedBy",
        select: "name email role",
      });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Error getting policy history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get policies with advanced filtering, sorting and pagination
// @route   GET /api/policies/filter
// @access  Private/Agent
exports.filterPolicies = async (req, res) => {
  try {
    let query = {};
    const user = req.user;

    // If agent, restrict to their policies
    if (user.role === "agent") {
      const agent = await Agent.findOne({ userID: user.id });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent profile not found",
        });
      }
      query.agentID = agent._id;
    }

    // Apply filters if provided
    const {
      companyName,
      startDateFrom,
      startDateTo,
      renewalDateFrom,
      renewalDateTo,
      renewalMonth,
      renewalYear,
      isActive,
      policyNumber,
      customerName,
      minPremium,
      maxPremium,
      minSumAssured,
      maxSumAssured,
    } = req.query;

    // Filter by company name
    if (companyName) {
      query.companyName = companyName;
    }

    // Filter by policy number
    if (policyNumber) {
      query.policyNumber = { $regex: policyNumber, $options: "i" };
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Filter by date ranges
    if (startDateFrom || startDateTo) {
      query.startDate = {};
      if (startDateFrom) {
        query.startDate.$gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        query.startDate.$lte = new Date(startDateTo);
      }
    }

    if (renewalDateFrom || renewalDateTo) {
      query.renewalDate = {};
      if (renewalDateFrom) {
        query.renewalDate.$gte = new Date(renewalDateFrom);
      }
      if (renewalDateTo) {
        query.renewalDate.$lte = new Date(renewalDateTo);
      }
    }

    // Filter by renewal month (1-12)
    if (renewalMonth) {
      const month = parseInt(renewalMonth);
      if (month >= 1 && month <= 12) {
        // Use MongoDB $expr and $month operator to filter by month part of date
        query.$expr = query.$expr || {};
        query.$expr.$eq = [{ $month: "$renewalDate" }, month];
      }
    }

    // Filter by renewal year
    if (renewalYear) {
      const year = parseInt(renewalYear);
      if (year >= 1900) {
        query.$expr = query.$expr || {};

        // If we already have month filter, use $and to combine with year filter
        if (query.$expr.$eq) {
          const monthExpr = query.$expr.$eq;
          query.$expr = {
            $and: [
              { $eq: monthExpr },
              { $eq: [{ $year: "$renewalDate" }, year] },
            ],
          };
        } else {
          query.$expr.$eq = [{ $year: "$renewalDate" }, year];
        }
      }
    }

    // Filter by premium range
    if (minPremium !== undefined || maxPremium !== undefined) {
      query.premium = {};
      if (minPremium !== undefined) {
        query.premium.$gte = parseFloat(minPremium);
      }
      if (maxPremium !== undefined) {
        query.premium.$lte = parseFloat(maxPremium);
      }
    }

    // Filter by sum assured range
    if (minSumAssured !== undefined || maxSumAssured !== undefined) {
      query.sumAssured = {};
      if (minSumAssured !== undefined) {
        query.sumAssured.$gte = parseFloat(minSumAssured);
      }
      if (maxSumAssured !== undefined) {
        query.sumAssured.$lte = parseFloat(maxSumAssured);
      }
    }

    // Handle sorting
    let sortOptions = {};
    const { sortBy, sortOrder } = req.query;

    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      // Default sort by creation date (newest first)
      sortOptions.createdAt = -1;
    }

    // Handle pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find policies with populated customer data and apply pagination
    const policies = await Policy.find(query)
      .populate({
        path: "customerID",
        populate: {
          path: "userID",
          select: "username name email",
        },
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Policy.countDocuments(query);

    res.status(200).json({
      success: true,
      count: policies.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: policies,
    });
  } catch (error) {
    console.error("Error filtering policies:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get policies by renewal month (for current or next year)
// @route   GET /api/policies/renewal-month/:month
// @access  Private/Agent
exports.getPoliciesByRenewalMonth = async (req, res) => {
  try {
    const month = parseInt(req.params.month);

    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid month (1-12)",
      });
    }

    // If agent, restrict to their policies
    let agentFilter = {};
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent profile not found",
        });
      }
      agentFilter.agentID = agent._id;
    }

    const currentYear = new Date().getFullYear();

    // Get policies that renew in the specified month of current year or next year
    const currentYearStart = new Date(currentYear, month - 1, 1);
    const currentYearEnd = new Date(currentYear, month, 0, 23, 59, 59);
    const nextYearStart = new Date(currentYear + 1, month - 1, 1);
    const nextYearEnd = new Date(currentYear + 1, month, 0, 23, 59, 59);

    const policies = await Policy.find({
      ...agentFilter,
      $or: [
        { renewalDate: { $gte: currentYearStart, $lte: currentYearEnd } },
        { renewalDate: { $gte: nextYearStart, $lte: nextYearEnd } },
      ],
    }).populate({
      path: "customerID",
      populate: {
        path: "userID",
        select: "username name email",
      },
    });

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    console.error("Error getting policies by renewal month:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get History with advanced filtering
// @route   GET /api/policies/historical
// @access  Private/Agent
exports.getHistoricalPolicies = async (req, res) => {
  try {
    // Get all policy history records
    let query = {};
    const user = req.user;

    // If agent, restrict to their policies
    if (user.role === "agent") {
      const agent = await Agent.findOne({ userID: user.id });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent profile not found",
        });
      }
      query.agentID = agent._id;
    }

    // console.log("Received query parameters:", req.query);

    // Apply filters if provided
    const {
      companyName,
      startDateFrom,
      startDateTo,
      renewalDateFrom,
      renewalDateTo,
      policyNumber,
      query: searchQuery, // Handle the new query parameter
      customerName,
      minPremium,
      maxPremium,
      minSumAssured,
      maxSumAssured,
      changeType,
      renewalMonth,
      renewalYear,
    } = req.query;

    // Filter by change type (only if specified)
    if (changeType) {
      query.changeType = changeType;
    }

    // Filter by company name
    if (companyName) {
      query.companyName = companyName;
    }

    // Handle search query - search across multiple fields
    if (searchQuery) {
      const searchRegex = { $regex: searchQuery, $options: "i" };
      query.$or = [
        { policyNumber: searchRegex },
        { title: searchRegex },
        { companyName: searchRegex },
      ];
    }
    // If only policyNumber is specified, use that for search
    else if (policyNumber) {
      query.policyNumber = { $regex: policyNumber, $options: "i" };
    }

    // Filter by renewal month if specified
    if (renewalMonth) {
      // Create a MongoDB aggregation to extract month from renewalDate
      // We need to match renewalDate where the month equals the provided renewalMonth
      query.$expr = {
        $eq: [{ $month: "$renewalDate" }, parseInt(renewalMonth)],
      };
    }

    // Filter by renewal year if specified
    if (renewalYear) {
      // If we already have an $expr, we need to use $and to combine conditions
      if (query.$expr) {
        query.$expr = {
          $and: [
            query.$expr,
            { $eq: [{ $year: "$renewalDate" }, parseInt(renewalYear)] },
          ],
        };
      } else {
        query.$expr = {
          $eq: [{ $year: "$renewalDate" }, parseInt(renewalYear)],
        };
      }
    }

    // Filter by date ranges
    if (startDateFrom || startDateTo) {
      query.startDate = {};
      if (startDateFrom) {
        query.startDate.$gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        query.startDate.$lte = new Date(startDateTo);
      }
    }

    if (renewalDateFrom || renewalDateTo) {
      query.renewalDate = {};
      if (renewalDateFrom) {
        query.renewalDate.$gte = new Date(renewalDateFrom);
      }
      if (renewalDateTo) {
        query.renewalDate.$lte = new Date(renewalDateTo);
      }
    }

    // Filter by premium range
    if (minPremium !== undefined || maxPremium !== undefined) {
      query.premium = {};
      if (minPremium !== undefined) {
        query.premium.$gte = parseFloat(minPremium);
      }
      if (maxPremium !== undefined) {
        query.premium.$lte = parseFloat(maxPremium);
      }
    }

    // Filter by sum assured range
    if (minSumAssured !== undefined || maxSumAssured !== undefined) {
      query.sumAssured = {};
      if (minSumAssured !== undefined) {
        query.sumAssured.$gte = parseFloat(minSumAssured);
      }
      if (maxSumAssured !== undefined) {
        query.sumAssured.$lte = parseFloat(maxSumAssured);
      }
    }

    // console.log("Final MongoDB query:", JSON.stringify(query));

    // Handle sorting
    let sortOptions = {};
    const { sortBy, sortOrder } = req.query;

    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      // Default sort by creation date (newest first)
      sortOptions.createdAt = -1;
    }

    // Find History with populated data - remove limit for now to get all records
    const historicalPolicies = await PolicyHistory.find(query)
      .populate({
        path: "policyID",
        select: "policyNumber companyName isActive",
      })
      .populate({
        path: "customerID",
        populate: {
          path: "userID",
          select: "username name email",
        },
      })
      .populate({
        path: "changedBy",
        select: "name email role",
      })
      .sort(sortOptions);

    // Get total count
    const total = historicalPolicies.length;

    res.status(200).json({
      success: true,
      count: historicalPolicies.length,
      total,
      data: historicalPolicies,
    });
  } catch (error) {
    console.error("Error getting History:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Check if policy number exists
// @route   GET /api/policies/check-policy-number/:policyNumber
// @access  Private/Agent
exports.checkPolicyNumber = async (req, res) => {
  try {
    const { policyNumber } = req.params;

    if (!policyNumber) {
      return res.status(400).json({
        success: false,
        message: "Policy number is required",
      });
    }

    const existingPolicy = await Policy.findOne({ policyNumber });

    res.status(200).json({
      success: true,
      exists: !!existingPolicy,
      message: existingPolicy
        ? `Policy number ${policyNumber} already exists`
        : `Policy number ${policyNumber} is available`,
    });
  } catch (error) {
    console.error("Error checking policy number:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete a historical policy record
// @route   DELETE /api/policies/historical/:id
// @access  Private/Agent
exports.deleteHistoricalPolicy = async (req, res) => {
  try {
    const historyRecord = await PolicyHistory.findById(req.params.id);

    if (!historyRecord) {
      return res.status(404).json({
        success: false,
        message: "Historical policy record not found",
      });
    }

    // If agent, verify they can delete this record
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userID: req.user.id });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent profile not found",
        });
      }

      // Check if this is their policy history
      if (historyRecord.agentID && !historyRecord.agentID.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this historical record",
        });
      }
    }

    // Delete the record
    await PolicyHistory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Historical policy record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting historical policy record:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
