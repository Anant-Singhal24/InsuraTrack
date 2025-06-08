import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import {
  FaSearch,
  FaFileAlt,
  FaDownload,
  FaFilePdf,
  FaClipboardList,
} from "react-icons/fa";

const CustomerPolicies = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [policyDocument, setPolicyDocument] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);

        // Get customer profile
        const customerResponse = await axios.get("/api/customers/me");
        const customer = customerResponse.data.data;

        // Get customer policies
        const policiesResponse = await axios.get(
          `/api/customers/${customer._id}/policies`
        );
        const policiesData = policiesResponse.data.data || [];
        const formattedAgents = customer.linkedAgentIDs.map((agent) => {
          // Make sure we have user data
          const userData = agent.userID || {};
          return {
            id: agent._id,
            name: userData.name || "Unnamed Agent",
            email: userData.email || "No Email Available",
            phone: userData.phone || "No Phone Available",
          };
        });
        // Format policy data for display
        const formattedPolicies = policiesData.map((policy) => {
          // Get agent data - we need to handle different possible structures
          const agentId = policy.agentID?._id;

          // Find the corresponding agent from linkedAgentIDs if available
          const linkedAgent =
            agentId && customer.linkedAgentIDs
              ? customer.linkedAgentIDs.find((a) => a._id === agentId)
              : null;

          // Try different ways to get agent information
          let agentName, agentEmail, agentPhone;

          // Try from the linked agent first (which may have more complete data)
          if (linkedAgent && linkedAgent.userID) {
            agentName = linkedAgent.userID.name || "No Agent";
            agentEmail = linkedAgent.userID.email || "No Email";
            agentPhone = linkedAgent.userID.phone || "No Phone";
          } else {
            // Fallback to policy's agent data
            const agent = policy.agentID || {};
            const agentUser = agent.userID || {};

            agentName = agentUser.name || agent.name || "No Agent";
            agentEmail = agentUser.email || agent.email || "No Email";
            agentPhone =
              agentUser.phone || agent.phone || policy.mobileNo || "No Phone";
          }

          return {
            _id: policy._id,
            policyNumber:
              policy.policyNumber || `POL-${policy._id.substring(0, 8)}`,
            title: policy.title,
            description: policy.description,
            premium: policy.premium,
            startDate: new Date(policy.startDate).toISOString().split("T")[0],
            renewalDate: new Date(policy.renewalDate)
              .toISOString()
              .split("T")[0],
            agentName,
            agentEmail,
            agentPhone,
            isActive: policy.isActive,
            companyName: policy.companyName || "LIC",
            sumAssured: policy.sumAssured || policy.premium * 100,
            mobileNo: policy.mobileNo || agentPhone,
            customerName: customer.userID?.name || "",
            customerEmail: customer.userID?.email || "",
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

    fetchPolicies();
  }, []);

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
      header: "Premium",
      accessor: "premium",
      render: (row) => `₹${row.premium.toLocaleString()}`,
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
  ];

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);

    // Check if the policy has a document
    if (policy._id) {
      checkPolicyDocument(policy._id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
    setPolicyDocument(null);
  };

  const checkPolicyDocument = async (policyId) => {
    try {
      setLoadingDocument(true);
      const response = await axios.get(`/api/policies/${policyId}/document`);
      setPolicyDocument(response.data.data);
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        console.error("Error checking policy document:", error);
      }
      // Don't show an error if there's no document (404)
      setPolicyDocument(null);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleDocumentDownload = async (policyId) => {
    try {
      setLoadingDocument(true);
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
      setLoadingDocument(false);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Could not download document. Please try again later.");
      setLoadingDocument(false);
    }
  };

  // Calculate days until renewal
  const getDaysUntilRenewal = (renewalDate) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const differenceInTime = renewal.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  };

  // Filter policies based on search query
  const filteredPolicies = policies.filter(
    (policy) =>
      policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">My Policies</h2>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search policies by title, policy number, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <DataTable
          columns={policyColumns}
          data={filteredPolicies}
          loading={loading}
          onRowClick={handleViewPolicy}
          emptyMessage="No policies found"
        />
      </div>

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
                <h3 className="text-2xl font-semibold dark:text-white">
                  {selectedPolicy.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Policy Number: {selectedPolicy.policyNumber}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Company: {selectedPolicy.companyName}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedPolicy.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedPolicy.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {selectedPolicy.description && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-lg font-medium mb-2 dark:text-white">
                  Description
                </h4>
                <p className="dark:text-gray-300">
                  {selectedPolicy.description}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Premium
                  </h4>
                  <p className="text-xl font-semibold dark:text-white">
                    ₹{selectedPolicy.premium.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sum Assured
                  </h4>
                  <p className="text-xl font-semibold dark:text-white">
                    ₹{selectedPolicy.sumAssured.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Contact Mobile
                  </h4>
                  <p className="text-lg dark:text-white">
                    {selectedPolicy.mobileNo || selectedPolicy.agentPhone}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Coverage Period
                  </h4>
                  <p className="dark:text-white">
                    {new Date(selectedPolicy.startDate).toLocaleDateString()} to{" "}
                    {new Date(selectedPolicy.renewalDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
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

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium mb-2 dark:text-white">
                Agent Information
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-base dark:text-white">
                      {selectedPolicy.agentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-base dark:text-white">
                      {selectedPolicy.agentEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="text-base dark:text-white">
                      {selectedPolicy.agentPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {loadingDocument ? (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2 dark:text-white">
                  Policy Document
                </h4>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-center py-2 w-full">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      Loading document information...
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2 dark:text-white">
                  Policy Document
                </h4>
                {policyDocument ? (
                  <div className="flex items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <FaFileAlt className="w-6 h-6 mr-3 text-primary-600" />
                    <div className="flex-grow">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDocumentDownload(selectedPolicy._id);
                        }}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {policyDocument.documentName || "Policy Document.pdf"}
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {policyDocument.documentUploadDate &&
                          `Uploaded: ${new Date(
                            policyDocument.documentUploadDate
                          ).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDocumentDownload(selectedPolicy._id)}
                      className="ml-2 px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 focus:outline-none flex items-center"
                    >
                      <FaDownload className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
                      <div className="flex flex-col items-center">
                        <FaClipboardList className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                        <p className="text-gray-600 dark:text-gray-400 text-center">
                          No document uploaded. Please upload a PDF document for
                          this policy.
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      No document uploaded. Please contact your agent to request
                      the policy document.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              {policyDocument && (
                <button
                  onClick={() => handleDocumentDownload(selectedPolicy._id)}
                  className="btn btn-primary mr-2 flex items-center"
                  disabled={!policyDocument}
                >
                  <FaDownload className="w-5 h-5 mr-1" />
                  Download Policy
                </button>
              )}
              <button
                onClick={() => {
                  closeModal();
                  navigate("/customer/contact-agent", {
                    state: {
                      subject: `About Policy: ${selectedPolicy.title}`,
                      policyInfo: `Policy: ${selectedPolicy.title}\nPolicy Number: ${selectedPolicy.policyNumber}`,
                    },
                  });
                }}
                className="btn btn-primary"
              >
                Contact Agent
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerPolicies;
