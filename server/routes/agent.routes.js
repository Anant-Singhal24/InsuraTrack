const express = require("express");
const {
  getAgentProfile,
  getAgentCustomers,
  getAgentOwnCustomers,
  getAgentOwnPolicies,
  linkSelfToCustomer,
  deleteCustomer,
  searchCustomers,
} = require("../controllers/agent.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// Search customers - accessible by agents
router.get("/search-customers", authorize("agent"), searchCustomers);

// Agent profile route - accessible by agents
router.get("/me", authorize("agent"), getAgentProfile);
router.get("/me/customers", authorize("agent"), getAgentOwnCustomers);
router.get("/me/policies", authorize("agent"), getAgentOwnPolicies);



// Get agent's customers - accessible by the agent themselves
router.get("/:id/customers", authorize("agent"), getAgentCustomers);

// Link agent (self) to an existing customer
router.post(
  "/me/link-customer/:customerId",
  authorize("agent"),
  linkSelfToCustomer
);

// Delete customer and their policies
router.delete("/customers/:id", authorize("agent"), deleteCustomer);

module.exports = router;
