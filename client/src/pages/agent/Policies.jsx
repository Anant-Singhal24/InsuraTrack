import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import React from "react";
import {
  FaFilter,
  FaClock,
  FaSearch,
  FaFileAlt,
  FaDownload,
  FaExchangeAlt,
  FaInfoCircle,
  FaClipboardList,
  FaUpload,
  FaSpinner,
} from "react-icons/fa";

const AgentPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [policyDocument, setPolicyDocument] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [policyHistory, setPolicyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [renewalData, setRenewalData] = useState({
    newRenewalDate: "",
    newPremium: "",
    notes: "",
  });
  const [processingRenewal, setProcessingRenewal] = useState(false);
  const [filters, setFilters] = useState({
    companyName: "",
    startDateFrom: "",
    startDateTo: "",
    renewalDateFrom: "",
    renewalDateTo: "",
    renewalMonth: "",
    renewalYear: "",
    minPremium: "",
    maxPremium: "",
    minSumAssured: "",
    maxSumAssured: "",
    sortBy: "renewalDate", // Default sort by renewal date
    sortOrder: "asc", // Default ascending order (closest renewal dates first)
  });
  const [checkingPolicyNumber, setCheckingPolicyNumber] = useState(false);
  const [policyNumberError, setPolicyNumberError] = useState("");
  const [policyNumberTimeout, setPolicyNumberTimeout] = useState(null);
  const documentInputRef = React.createRef();

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Add a filtered policies effect that runs when searchQuery or policies change
  const filteredPolicies = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return policies;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    return policies.filter(
      (policy) =>
        policy.title.toLowerCase().includes(lowerCaseQuery) ||
        policy.policyNumber.toLowerCase().includes(lowerCaseQuery) ||
        policy.companyName.toLowerCase().includes(lowerCaseQuery) ||
        policy.customerName.toLowerCase().includes(lowerCaseQuery)
    );
  }, [searchQuery, policies]);

  const fetchPolicies = async (useFilters = false) => {
    try {
      setLoading(true);

      let endpoint = "/api/agents/me/policies";
      let params = {};

      // Apply filters for advanced API endpoint if requested
      if (useFilters) {
        endpoint = "/api/policies/filter";

        // Only add filters with values
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            params[key] = value;
          }
        });

        // Add active/inactive status filter if set
        if (filterStatus !== "all") {
          params.isActive = filterStatus === "active";
        }

        // Add search query if present
        if (searchQuery) {
          params.policyNumber = searchQuery;
        }
      }

      const response = await axios.get(endpoint, { params });

      // Transform data to match our expected format
      const formattedPolicies = response.data.data.map((policy) => {
        const customerName =
          policy.customerID?.userID?.name || "Unknown Customer";
        const customerEmail = policy.customerID?.userID?.email || "";

        return {
          id: policy._id,
          title: policy.title,
          description: policy.description,
          premium: policy.premium,
          startDate: new Date(policy.startDate).toISOString().split("T")[0],
          renewalDate: new Date(policy.renewalDate).toISOString().split("T")[0],
          customerName,
          customerEmail,
          policyNumber:
            policy.policyNumber || `POL-${policy._id.substring(0, 8)}`,
          companyName: policy.companyName || "OTHER",
          mobileNo: policy.mobileNo || "N/A",
          sumAssured: policy.sumAssured || 0,
          isActive: policy.isActive,
          customerId: policy.customerID._id,
        };
      });

      setPolicies(formattedPolicies);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to load policies");
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchPolicies(true);
    setIsFilterModalOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      companyName: "",
      startDateFrom: "",
      startDateTo: "",
      renewalDateFrom: "",
      renewalDateTo: "",
      renewalMonth: "",
      renewalYear: "",
      minPremium: "",
      maxPremium: "",
      minSumAssured: "",
      maxSumAssured: "",
      sortBy: "renewalDate",
      sortOrder: "asc",
    });
    setFilterStatus("all");
    setSearchQuery("");
    fetchPolicies(false);
    setIsFilterModalOpen(false);
  };

  const policyColumns = [
    {
      header: "Policy Number",
      accessor: "policyNumber",
    },
    {
      header: "Type",
      accessor: "title",
    },
    {
      header: "Company",
      accessor: "companyName",
    },
    {
      header: "Customer",
      accessor: "customerName",
    },
    {
      header: "Premium",
      accessor: "premium",
      render: (row) => `₹${row.premium.toLocaleString()}`,
    },
    {
      header: "Sum Assured",
      accessor: "sumAssured",
      render: (row) => `₹${row.sumAssured.toLocaleString()}`,
    },
    {
      header: "Renewal Date",
      accessor: "renewalDate",
      render: (row) => new Date(row.renewalDate).toLocaleDateString(),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewPolicy(row);
            }}
            className="text-primary-600 hover:text-primary-800"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditPolicy(row);
            }}
            className="text-secondary-600 hover:text-secondary-800"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRenewPolicy(row);
            }}
            className="text-amber-600 hover:text-amber-800"
          >
            Renew
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePolicy(row);
            }}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);

    // Check if the policy has a document
    if (policy.id) {
      checkPolicyDocument(policy.id);
    }
  };

  const checkPolicyDocument = async (policyId) => {
    try {
      const response = await axios.get(`/api/policies/${policyId}/document`);
      setPolicyDocument(response.data.data);
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        console.error("Error checking policy document:", error);
      }
      // Don't show an error if there's no document (404)
      setPolicyDocument(null);
    }
  };

  const handleEditPolicy = (policy) => {
    setEditedPolicy({
      ...policy,
      premium: policy.premium.toString(),
      sumAssured: policy.sumAssured.toString(),
      startDate: policy.startDate.split("T")[0], // Format for date input
      renewalDate: policy.renewalDate.split("T")[0], // Format for date input
      originalPolicyNumber: policy.policyNumber, // Store original policy number for comparison
    });

    // Check if the policy has a document
    if (policy.id) {
      checkPolicyDocument(policy.id);
    }

    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
    setPolicyDocument(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditedPolicy(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPolicy({
      ...editedPolicy,
      [name]: value,
    });

    // Check if policy number is unique after user stops typing
    if (
      name === "policyNumber" &&
      value.trim() !== "" &&
      value !== editedPolicy.originalPolicyNumber
    ) {
      setPolicyNumberError("");

      // Clear previous timeout
      if (policyNumberTimeout) {
        clearTimeout(policyNumberTimeout);
      }

      // Set new timeout to check policy number
      const timeoutId = setTimeout(() => {
        checkPolicyNumberUnique(value);
      }, 500); // Wait 500ms after user stops typing

      setPolicyNumberTimeout(timeoutId);
    }
  };

  // Function to check if policy number is unique
  const checkPolicyNumberUnique = async (policyNumber) => {
    if (!policyNumber.trim()) return;

    try {
      setCheckingPolicyNumber(true);
      const response = await axios.get(
        `/api/policies/check-policy-number/${policyNumber}`
      );

      if (
        response.data.exists &&
        policyNumber !== editedPolicy.originalPolicyNumber
      ) {
        setPolicyNumberError(
          `${policyNumber} is already in use. Please enter a unique policy number.`
        );
      } else {
        setPolicyNumberError("");
      }
    } catch (error) {
      console.error("Error checking policy number:", error);
      // Don't set error message here, as it's better to just let form validation handle it
    } finally {
      setCheckingPolicyNumber(false);
    }
  };

  const handleStatusChange = (e) => {
    setEditedPolicy({
      ...editedPolicy,
      isActive: e.target.value === "active",
    });
  };

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();

    try {
      const {
        id,
        title,
        description,
        premium,
        startDate,
        renewalDate,
        isActive,
        policyNumber,
        mobileNo,
        sumAssured,
        companyName,
      } = editedPolicy;

      // Validate form fields
      if (
        !title ||
        !description ||
        !premium ||
        !startDate ||
        !renewalDate ||
        !policyNumber ||
        !mobileNo ||
        !sumAssured
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Check if policy number is unique before submission
      if (policyNumberError) {
        toast.error(policyNumberError);
        return;
      }

      // Update policy with API
      const response = await axios.put(`/api/policies/${id}`, {
        title,
        description,
        premium: parseFloat(premium),
        startDate,
        renewalDate,
        isActive,
        policyNumber,
        mobileNo,
        sumAssured: parseFloat(sumAssured),
        companyName,
      });

      // Check if there's a new document to upload
      if (
        policyDocument &&
        policyDocument.newFile &&
        policyDocument.pendingUpload
      ) {
        try {
          setUploadingDocument(true);

          const formData = new FormData();
          formData.append("policyDocument", policyDocument.newFile);

          await axios.post(`/api/policies/${id}/document`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          toast.success("Policy document updated successfully");
        } catch (docError) {
          console.error("Error uploading document:", docError);
          toast.error(
            "Failed to update policy document. Policy details were saved."
          );
        } finally {
          setUploadingDocument(false);
        }
      }

      toast.success(`Policy ${editedPolicy.policyNumber} updated!`);

      // Update the policy in the local state
      setPolicies(
        policies.map((p) =>
          p.id === editedPolicy.id
            ? {
                ...p,
                title: editedPolicy.title,
                description: editedPolicy.description,
                premium: parseFloat(editedPolicy.premium),
                startDate: editedPolicy.startDate,
                renewalDate: editedPolicy.renewalDate,
                isActive: editedPolicy.isActive,
                policyNumber: editedPolicy.policyNumber,
                mobileNo: editedPolicy.mobileNo,
                sumAssured: parseFloat(editedPolicy.sumAssured),
                companyName: editedPolicy.companyName,
              }
            : p
        )
      );

      closeEditModal();
      setPolicyNumberError("");
    } catch (error) {
      console.error("Error updating policy:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update policy";
      toast.error(errorMessage);
    }
  };

  const handleDeletePolicy = async (policy) => {
    if (
      window.confirm(
        `Are you sure you want to delete policy ${policy.policyNumber}?`
      )
    ) {
      try {
        await axios.delete(`/api/policies/${policy.id}`);
        toast.success(`Policy ${policy.policyNumber} deleted successfully`);

        // Remove the deleted policy from the local state
        setPolicies(policies.filter((p) => p.id !== policy.id));
      } catch (error) {
        console.error("Error deleting policy:", error);
        // Add more detailed error message
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : error.message || "Failed to delete policy";

        toast.error(`Failed to delete policy: ${errorMessage}`);
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    const fileInput = documentInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Please select a PDF document to upload");
      return;
    }

    const file = fileInput.files[0];
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    try {
      setUploadingDocument(true);

      const formData = new FormData();
      formData.append("policyDocument", file);

      const response = await axios.post(
        `/api/policies/${selectedPolicy.id}/document`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the policy document state
      setPolicyDocument(response.data.data);

      // Show success message from the server
      toast.success(response.data.message || "Document processed successfully");

      // Reset the file input and upload state
      if (fileInput) {
        fileInput.value = "";
      }
      setUploadingDocument(false);
    } catch (error) {
      console.error("Error uploading document:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to upload document";
      toast.error(errorMessage);
      setUploadingDocument(false);
    }
  };

  const handleDocumentDownload = async (policyId) => {
    try {
      setUploadingDocument(true);
      const response = await axios.get(
        `/api/policies/${policyId}/document/download`,
        {
          responseType: "blob", // Important: we need to receive the document as binary data
        }
      );

      // Create a blob URL from the binary data
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      // Create a hidden link element to trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from Content-Disposition header if available, otherwise use a default
      const contentDisposition = response.headers["content-disposition"];
      let filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        filename = filenameMatch ? filenameMatch[1] : `policy-document.pdf`;
      } else {
        filename = `policy-document.pdf`;
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setUploadingDocument(false);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Could not download document. Please try again later.");
      setUploadingDocument(false);
    }
  };

  const handleRenewPolicy = (policy) => {
    // Calculate a default new renewal date (1 year from current renewal date)
    const currentRenewal = new Date(policy.renewalDate);
    const defaultNewRenewal = new Date(currentRenewal);
    defaultNewRenewal.setFullYear(defaultNewRenewal.getFullYear() + 1);

    // Set default renewal data
    setRenewalData({
      newRenewalDate: defaultNewRenewal.toISOString().split("T")[0],
      newPremium: policy.premium.toString(),
      notes: `Annual renewal for policy ${policy.policyNumber}`,
    });

    setSelectedPolicy(policy);
    setIsRenewalModalOpen(true);
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();

    try {
      setProcessingRenewal(true);

      if (!renewalData.newRenewalDate) {
        toast.error("Renewal date is required");
        return;
      }

      const newRenewalDate = new Date(renewalData.newRenewalDate);
      const currentDate = new Date();

      // Validate renewal date is in the future
      if (newRenewalDate <= currentDate) {
        toast.error("Renewal date must be in the future");
        setProcessingRenewal(false);
        return;
      }

      const response = await axios.post(
        `/api/policies/${selectedPolicy.id}/renew`,
        renewalData
      );

      // Update the policy in the local state
      const updatedPolicy = response.data.data.policy;
      setPolicies(
        policies.map((p) =>
          p.id === selectedPolicy.id
            ? {
                ...p,
                premium: parseFloat(renewalData.newPremium || p.premium),
                startDate: updatedPolicy.startDate,
                renewalDate: updatedPolicy.renewalDate,
              }
            : p
        )
      );

      toast.success("Policy renewed successfully!");
      setIsRenewalModalOpen(false);
      setProcessingRenewal(false);
    } catch (error) {
      console.error("Error renewing policy:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to renew policy";
      toast.error(errorMessage);
      setProcessingRenewal(false);
    }
  };

  const handleRenewalInputChange = (e) => {
    setRenewalData({
      ...renewalData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchPolicyHistory = async (policyId) => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`/api/policies/${policyId}/history`);
      setPolicyHistory(response.data.data);
      setLoadingHistory(false);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching policy history:", error);
      toast.error("Failed to load policy history");
      setLoadingHistory(false);
    }
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            All Policies
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="btn btn-outline flex items-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FaFilter className="h-5 w-5 mr-1" />
              Advanced Filter
            </button>
            <Link
              to="/agent/policies/history"
              className="btn btn-secondary flex items-center"
            >
              <FaClock className="h-5 w-5 mr-1" />
              Policy History
            </Link>
            <Link
              to="/agent/customers"
              className="btn btn-primary"
              title="Select a customer to create a new policy"
            >
              Create New Policy
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search policies by title, policy number, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="statusFilter"
            className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Policies</option>
            <option value="active">Active Policies</option>
            <option value="inactive">Inactive Policies</option>
          </select>
        </div>

        <DataTable
          columns={policyColumns}
          data={filteredPolicies}
          loading={loading}
          onRowClick={handleViewPolicy}
          emptyMessage="No policies found"
        />
      </div>

      {/* Advanced Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Advanced Filter & Sort Options"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="companyName"
                className="form-label dark:text-gray-300"
              >
                Insurance Company
              </label>
              <select
                id="companyName"
                name="companyName"
                value={filters.companyName}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Companies</option>
                <option value="HDFC ERGO">HDFC ERGO</option>
                <option value="HDFC LIFE">HDFC LIFE</option>
                <option value="LIC">LIC</option>
                <option value="STAR HEALTH">STAR HEALTH</option>
                <option value="CARE HEALTH">CARE HEALTH</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="renewalMonth"
                className="form-label dark:text-gray-300"
              >
                Renewal Month
              </label>
              <select
                id="renewalMonth"
                name="renewalMonth"
                value={filters.renewalMonth}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="renewalYear"
                className="form-label dark:text-gray-300"
              >
                Renewal Year
              </label>
              <select
                id="renewalYear"
                name="renewalYear"
                value={filters.renewalYear}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any Year</option>
                {/* Generate options for current year and 5 years into the future */}
                {Array.from({ length: 6 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium mb-2 dark:text-white">Date Ranges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label dark:text-gray-300">
                  Start Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="startDateFrom"
                      className="form-label text-xs dark:text-gray-400"
                    >
                      From
                    </label>
                    <input
                      id="startDateFrom"
                      name="startDateFrom"
                      type="date"
                      value={filters.startDateFrom}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="startDateTo"
                      className="form-label text-xs dark:text-gray-400"
                    >
                      To
                    </label>
                    <input
                      id="startDateTo"
                      name="startDateTo"
                      type="date"
                      value={filters.startDateTo}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label dark:text-gray-300">
                  Renewal Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="renewalDateFrom"
                      className="form-label text-xs dark:text-gray-400"
                    >
                      From
                    </label>
                    <input
                      id="renewalDateFrom"
                      name="renewalDateFrom"
                      type="date"
                      value={filters.renewalDateFrom}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="renewalDateTo"
                      className="form-label text-xs dark:text-gray-400"
                    >
                      To
                    </label>
                    <input
                      id="renewalDateTo"
                      name="renewalDateTo"
                      type="date"
                      value={filters.renewalDateTo}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="btn btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </Modal>

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Policy Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  {selectedPolicy.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Policy Number: {selectedPolicy.policyNumber}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Company:{" "}
                  <span className="font-medium dark:text-gray-300">
                    {selectedPolicy.companyName}
                  </span>
                </p>
              </div>
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  selectedPolicy.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {selectedPolicy.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="mb-4 dark:text-gray-300">
                {selectedPolicy.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Premium
                  </h4>
                  <p className="text-lg font-semibold dark:text-white">
                    ₹{selectedPolicy.premium.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sum Assured
                  </h4>
                  <p className="text-lg font-semibold dark:text-white">
                    ₹{selectedPolicy.sumAssured.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Contact Mobile
                  </h4>
                  <p className="text-lg dark:text-white">
                    {selectedPolicy.mobileNo}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Coverage Period
                </h4>
                <p className="dark:text-gray-300">
                  {new Date(selectedPolicy.startDate).toLocaleDateString()} to{" "}
                  {new Date(selectedPolicy.renewalDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-2 dark:text-white">
                Customer Information
              </h4>
              <p className="dark:text-gray-300">
                {selectedPolicy.customerName}
              </p>
              <p className="dark:text-gray-300">
                {selectedPolicy.customerEmail}
              </p>
            </div>

            {policyDocument ? (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-2 dark:text-white">
                  Policy Document
                </h4>
                <div className="flex items-center">
                  <FaFileAlt className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDocumentDownload(selectedPolicy.id);
                    }}
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {policyDocument.documentName || "View Policy Document"}
                  </a>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {policyDocument.documentUploadDate &&
                      `(Uploaded: ${new Date(
                        policyDocument.documentUploadDate
                      ).toLocaleDateString()})`}
                  </span>
                </div>

                {/* Add replace document option */}
                {!uploadingDocument ? (
                  <div className="mt-2">
                    <button
                      onClick={() => setUploadingDocument(true)}
                      className="text-xs text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300 flex items-center"
                    >
                      <FaExchangeAlt className="w-3 h-3 mr-1" />
                      Replace Document
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleDocumentUpload}
                    className="mt-3 flex items-center"
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={documentInputRef}
                      className="flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="ml-2 flex space-x-1">
                      <button type="submit" className="btn btn-sm btn-primary">
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadingDocument(false)}
                        className="btn btn-sm btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-2 dark:text-white">
                  Policy Document
                </h4>
                {uploadingDocument ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 dark:text-gray-300">
                      Uploading document...
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleDocumentUpload}
                    className="flex items-center"
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={documentInputRef}
                      className="flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button type="submit" className="ml-2 btn btn-primary">
                      Upload
                    </button>
                  </form>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No document uploaded. Please upload a PDF document for this
                  policy.
                </p>
              </div>
            )}

            {/* Add history button */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => fetchPolicyHistory(selectedPolicy.id)}
                className="btn btn-secondary"
              >
                {loadingHistory ? "Loading History..." : "View Policy History"}
              </button>
              <button
                onClick={() => {
                  closeModal();
                  handleEditPolicy(selectedPolicy);
                }}
                className="btn btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit Policy
              </button>
              <button
                onClick={() => {
                  closeModal();
                  handleRenewPolicy(selectedPolicy);
                }}
                className="btn btn-primary"
              >
                Renew Policy
              </button>
              <button
                onClick={() => {
                  closeModal();
                  handleDeletePolicy(selectedPolicy);
                }}
                className="btn btn-danger"
              >
                Delete Policy
              </button>
            </div>

            {/* Policy History Section */}
            {showHistory && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 className="font-medium mb-2 dark:text-white">
                  Policy History
                </h4>
                {policyHistory.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Change Type
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Premium
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Coverage Period
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {policyHistory.map((record) => (
                          <tr key={record._id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  record.changeType === "renewal"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : record.changeType === "update"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {record.changeType.charAt(0).toUpperCase() +
                                  record.changeType.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              ₹{record.premium.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {new Date(record.startDate).toLocaleDateString()}{" "}
                              to{" "}
                              {new Date(
                                record.renewalDate
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                              {record.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No history records found for this policy.
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Policy Modal */}
      {editedPolicy && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title="Edit Policy"
          size="lg"
        >
          <form onSubmit={handleUpdatePolicy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="policyNumber"
                  className="form-label dark:text-gray-300"
                >
                  Policy Number
                </label>
                <div className="relative">
                  <input
                    id="policyNumber"
                    name="policyNumber"
                    type="text"
                    value={editedPolicy.policyNumber}
                    onChange={handleEditInputChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      policyNumberError
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none ${
                      policyNumberError
                        ? "focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-primary-500 focus:border-primary-500"
                    } dark:bg-gray-700 dark:text-white`}
                    required
                  />
                  {checkingPolicyNumber && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <FaSpinner className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                {policyNumberError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {policyNumberError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="companyName"
                  className="form-label dark:text-gray-300"
                >
                  Insurance Company
                </label>
                <select
                  id="companyName"
                  name="companyName"
                  value={editedPolicy.companyName || "OTHER"}
                  onChange={handleEditInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="HDFC ERGO">HDFC ERGO</option>
                  <option value="HDFC LIFE">HDFC LIFE</option>
                  <option value="LIC">LIC</option>
                  <option value="STAR HEALTH">STAR HEALTH</option>
                  <option value="CARE HEALTH">CARE HEALTH</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="title" className="form-label dark:text-gray-300">
                Policy Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={editedPolicy.title}
                onChange={handleEditInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="form-label dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={editedPolicy.description}
                onChange={handleEditInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="mobileNo"
                  className="form-label dark:text-gray-300"
                >
                  Contact Mobile Number
                </label>
                <input
                  id="mobileNo"
                  name="mobileNo"
                  type="text"
                  value={editedPolicy.mobileNo || ""}
                  onChange={handleEditInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="sumAssured"
                  className="form-label dark:text-gray-300"
                >
                  Sum Assured (₹)
                </label>
                <input
                  id="sumAssured"
                  name="sumAssured"
                  type="number"
                  min="0"
                  step="1"
                  value={editedPolicy.sumAssured || ""}
                  onChange={handleEditInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="premium"
                  className="form-label dark:text-gray-300"
                >
                  Premium Amount (₹)
                </label>
                <input
                  id="premium"
                  name="premium"
                  type="number"
                  min="0"
                  step="1"
                  value={editedPolicy.premium}
                  onChange={handleEditInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="form-label dark:text-gray-300"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={editedPolicy.startDate}
                  onChange={handleEditInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="renewalDate"
                  className="form-label dark:text-gray-300"
                >
                  Renewal Date
                </label>
                <input
                  id="renewalDate"
                  name="renewalDate"
                  type="date"
                  value={editedPolicy.renewalDate}
                  onChange={handleEditInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="form-label dark:text-gray-300"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={editedPolicy.isActive ? "active" : "inactive"}
                  onChange={handleStatusChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Document Management Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 className="font-medium mb-2 dark:text-white">
                Policy Document
              </h4>

              {policyDocument ? (
                <div>
                  <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-2">
                    <FaFileAlt className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <div className="flex-grow">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {policyDocument.documentName}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {policyDocument.documentUploadDate &&
                          `Uploaded: ${new Date(
                            policyDocument.documentUploadDate
                          ).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDocumentDownload(editedPolicy.id)}
                      className="px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none text-sm"
                    >
                      View
                    </button>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center">
                      <label
                        htmlFor="replaceDocument"
                        className="form-label text-sm mr-2 dark:text-gray-300"
                      >
                        Replace document:
                      </label>
                      <input
                        id="replaceDocument"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.type === "application/pdf") {
                            setPolicyDocument({
                              ...policyDocument,
                              newFile: file,
                              pendingUpload: true,
                            });
                          } else if (file) {
                            toast.error("Please select a PDF file");
                            e.target.value = "";
                          }
                        }}
                        className="text-sm flex-grow dark:text-gray-300"
                      />
                    </div>
                    {policyDocument.pendingUpload && (
                      <div className="mt-1">
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          New document selected. Click "Update Policy" to save
                          all changes including the new document.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    No policy document available
                  </p>
                  <div className="flex items-center justify-center">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.type === "application/pdf") {
                          setPolicyDocument({
                            newFile: file,
                            pendingUpload: true,
                          });
                        } else if (file) {
                          toast.error("Please select a PDF file");
                          e.target.value = "";
                        }
                      }}
                      className="text-sm dark:text-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={closeEditModal}
                className="btn btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={uploadingDocument}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploadingDocument}
              >
                {uploadingDocument ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-1">Saving...</span>
                  </span>
                ) : (
                  "Update Policy"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renewal Modal */}
      {selectedPolicy && (
        <Modal
          isOpen={isRenewalModalOpen}
          onClose={() => !processingRenewal && setIsRenewalModalOpen(false)}
          title="Renew Policy"
          size="md"
        >
          <form onSubmit={handleRenewalSubmit} className="space-y-4">
            <div className="mb-4">
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaInfoCircle className="h-5 w-5 text-amber-400 dark:text-amber-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700 dark:text-amber-200">
                      You are renewing policy{" "}
                      <strong>{selectedPolicy.policyNumber}</strong> for{" "}
                      <strong>{selectedPolicy.customerName}</strong>. The
                      current policy expires on{" "}
                      <strong>
                        {new Date(
                          selectedPolicy.renewalDate
                        ).toLocaleDateString()}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="newRenewalDate"
                className="form-label dark:text-gray-300"
              >
                New Renewal Date <span className="text-red-500">*</span>
              </label>
              <input
                id="newRenewalDate"
                name="newRenewalDate"
                type="date"
                value={renewalData.newRenewalDate}
                onChange={handleRenewalInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will be the new expiration date for the policy.
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="newPremium"
                className="form-label dark:text-gray-300"
              >
                New Premium Amount (₹)
              </label>
              <input
                id="newPremium"
                name="newPremium"
                type="number"
                min="0"
                step="1"
                value={renewalData.newPremium}
                onChange={handleRenewalInputChange}
                placeholder={`Current: ₹${selectedPolicy?.premium.toLocaleString()}`}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to keep the current premium of ₹
                {selectedPolicy?.premium.toLocaleString()}.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="form-label dark:text-gray-300">
                Renewal Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={renewalData.notes}
                onChange={handleRenewalInputChange}
                placeholder="Add notes about this renewal"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(false)}
                className="btn btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={processingRenewal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={processingRenewal}
              >
                {processingRenewal ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-1">Processing...</span>
                  </span>
                ) : (
                  "Renew Policy"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AgentPolicies;
