const express = require("express");
const {
  getCustomer,
  getCustomerProfile,
  getCustomerPolicies,
  updateCustomer,
  createCustomer,
} = require("../controllers/customer.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// Customer profile route - accessible by customers
router.get("/me", authorize("customer"), getCustomerProfile);

router.post("/", authorize("agent"), createCustomer);
router.get("/:id", authorize("agent"), getCustomer);
router.put("/:id", authorize("agent"), updateCustomer);
router.get(
  "/:id/policies",
  authorize("agent", "customer"),
  getCustomerPolicies
);

module.exports = router;
