const express = require("express");
const {
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  uploadPolicyDoc,
  getPolicyDocument,
  downloadPolicyDocument,
  getPoliciesByAgent,
  renewPolicy,
  getPolicyHistory,
  filterPolicies,
  getPoliciesByRenewalMonth,
  checkPolicyNumber,
  getHistoricalPolicies,
  deleteHistoricalPolicy,
} = require("../controllers/policy.controller");
const { protect, authorize } = require("../middleware/auth");
const { uploadPolicyDocument } = require("../middleware/upload");

const router = express.Router();

// Protect all routes
router.use(protect);

// Check if policy number exists
router.get(
  "/check-policy-number/:policyNumber",
  authorize("agent"),
  checkPolicyNumber
);

// Filter and sort policies - agent only
router.get("/filter", authorize("agent"), filterPolicies);

// Get History - agent only
router.get("/historical", authorize("agent"), getHistoricalPolicies);

// Get policies by renewal month
router.get(
  "/renewal-month/:month",
  authorize("agent"),
  getPoliciesByRenewalMonth
);

// Get single policy
router.get("/:id", authorize("agent", "customer"), getPolicy);

// Get policy document metadata
router.get("/:id/document", authorize("agent", "customer"), getPolicyDocument);

// Download policy document file
router.get(
  "/:id/document/download",
  authorize("agent", "customer"),
  downloadPolicyDocument
);

// Create policy - agent only
router.post("/", authorize("agent"), createPolicy);

// Upload document for a policy - agent only
router.post(
  "/:id/document",
  authorize("agent"),
  uploadPolicyDocument.single("policyDocument"),
  uploadPolicyDoc
);

// Update policy - agent only
router.put("/:id", authorize("agent"), updatePolicy);

// Toggle policy active status
router.put("/:id/toggle-status", authorize("agent"), (req, res) => {
  // Pass to updatePolicy with only isActive field
  req.body = { isActive: undefined }; // Will be toggled in controller
  req.toggleStatus = true; // Special flag to toggle instead of set directly
  updatePolicy(req, res);
});

// Delete policy - agent only
router.delete("/:id", authorize("agent"), deletePolicy);

// Renew policy
router.route("/:id/renew").post(authorize("agent"), renewPolicy);

// Get policy history
router.route("/:id/history").get(authorize("agent"), getPolicyHistory);

// Historical policy routes
router.delete("/historical/:id", authorize("agent"), deleteHistoricalPolicy);

module.exports = router;
