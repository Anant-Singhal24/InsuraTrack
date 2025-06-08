import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import PasswordInputWithEye from "../../components/ui/PasswordInputWithEye";
import { FaSearch } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa";

const AgentCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isViewPoliciesModalOpen, setIsViewPoliciesModalOpen] = useState(false);
  const [isLinkToExistingModalOpen, setIsLinkToExistingModalOpen] =
    useState(false);
  const [customerPolicies, setCustomerPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [policySearchQuery, setPolicySearchQuery] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    description: "",
    premium: "",
    startDate: "",
    renewalDate: "",
    policyNumber: "",
    mobileNo: "",
    sumAssured: "",
    companyName: "OTHER",
  });
  const [policyDocument, setPolicyDocument] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [checkingPolicyNumber, setCheckingPolicyNumber] = useState(false);
  const [policyNumberError, setPolicyNumberError] = useState("");
  const [policyNumberTimeout, setPolicyNumberTimeout] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingAllCustomers, setLoadingAllCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] =
    useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Effect to generate username suggestions when name changes
  useEffect(() => {
    const generateUsernameForNewCustomer = async () => {
      if (newCustomer.name && !newCustomer.username) {
        try {
          const uniqueUsername = await generateUniqueUsername(newCustomer.name);
          setNewCustomer((prev) => ({
            ...prev,
            username: uniqueUsername,
          }));
        } catch (error) {
          console.error("Error auto-generating username:", error);
        }
      }
    };

    // Only run the async function if there's a name but no username
    if (newCustomer.name && !newCustomer.username) {
      generateUsernameForNewCustomer();
    }
  }, [newCustomer.name]);

  // Generate a random secure password when the add customer modal opens
  useEffect(() => {
    if (isAddCustomerModalOpen) {
      setNewCustomer((prev) => ({
        ...prev,
        password: generatePassword(),
      }));
    }
  }, [isAddCustomerModalOpen]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const customersResponse = await axios.get("/api/agents/me/customers");

      // Fetch policies to calculate accurate premiums
      const policiesResponse = await axios.get("/api/agents/me/policies");
      const policies = policiesResponse.data.data || [];

      // Transform data to match our expected format
      const formattedCustomers = customersResponse.data.data.map((customer) => {
        const userData = customer.userID || {};

        // Find all policies for this customer
        const customerPolicies = policies.filter(
          (policy) => policy.customerID._id === customer._id
        );

        // Calculate total premium
        const totalPremium = customerPolicies.reduce(
          (sum, policy) => sum + (policy.premium || 0),
          0
        );

        // Get the phone number (if it exists) or use a default value
        const phoneNumber = userData.phone || "";

        return {
          id: customer._id,
          name: userData.name || "No Name",
          email: userData.email || "No Email",
          phone: phoneNumber === "" ? "No Phone" : phoneNumber,
          policies: customerPolicies.length,
          totalPremium,
          joinDate: new Date(customer.createdAt).toISOString().split("T")[0],
        };
      });

      setCustomers(formattedCustomers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
      setLoading(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      setLoadingAllCustomers(true);

      // This would ideally be a search API endpoint with pagination
      // For this implementation, we'll use the agent endpoint
      const response = await axios.get("/api/agents/search-customers", {
        params: { query: customerSearchQuery },
      });

      setAllCustomers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoadingAllCustomers(false);
    }
  };

  const customerColumns = [
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Phone",
      accessor: "phone",
    },
    {
      header: "Policies",
      accessor: "policies",
    },
    {
      header: "Total Premium",
      accessor: "totalPremium",
      render: (row) =>
        row.totalPremium ? `₹${row.totalPremium.toLocaleString()}` : "₹0",
    },
    {
      header: "Client Since",
      accessor: "joinDate",
      render: (row) => new Date(row.joinDate).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewCustomer(row);
            }}
            className="text-primary-600 hover:text-primary-800"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddPolicy(row);
            }}
            className="text-secondary-600 hover:text-secondary-800"
          >
            Add Policy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewPolicies(row);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Policies
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCustomer(row);
            }}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddPolicy = (customer) => {
    setSelectedCustomer(customer);
    setIsAddPolicyModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const closeAddPolicyModal = () => {
    setIsAddPolicyModalOpen(false);
  };

  const closeAddCustomerModal = () => {
    setIsAddCustomerModalOpen(false);
    setNewCustomer({
      name: "",
      username: "",
      email: "",
      password: "",
      phone: "",
    });
  };

  // Generate username from full name
  const generateUsername = (fullName) => {
    if (!fullName) return "";

    // Remove special characters and spaces, convert to lowercase
    const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    // If name is too short, just return it with a random number
    if (cleanName.length < 3) {
      return cleanName + Math.floor(1000 + Math.random() * 9000);
    }

    // Take first 8 characters or full name if shorter
    const baseUsername = cleanName.substring(0, 8);

    // Add a random 4-digit number to make it more unique
    return baseUsername + Math.floor(1000 + Math.random() * 9000);
  };

  // Generate a secure random password
  const generatePassword = () => {
    // Characters to use in password
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "@#$%^&*!";

    // Ensure at least one of each type
    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Add more random characters to reach 8 characters
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password characters
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  // Check if username exists
  const checkUsernameExists = async (username) => {
    try {
      const response = await axios.get(`/api/users/check-username/${username}`);
      return response.data.exists;
    } catch (error) {
      console.error("Error checking username:", error);
      // If error occurs, assume username might exist to be safe
      return true;
    }
  };

  // Modified function to handle customer input change
  const handleCustomerInputChange = (e) => {
    const { name, value } = e.target;

    // Update the form state
    setNewCustomer({
      ...newCustomer,
      [name]: value,
    });
  };

  // Generate password button handler
  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setNewCustomer((prev) => ({
      ...prev,
      password: newPassword,
    }));
    toast.info("Generated a secure password");
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    try {
      const { name, username, email, password, phone } = newCustomer;

      // Validate form fields
      if (!name || !email || !username || !password) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Send request to create customer
      const response = await axios.post("/api/customers", {
        name,
        email,
        username,
        password,
        phone: phone.trim() || "", // Ensure empty string if phone is just whitespace
      });

      const { customer, user } = response.data.data;

      // Add the new customer to the customers list
      const newCustomerData = {
        id: customer._id,
        name: user.name,
        email: user.email,
        phone: user.phone ? user.phone : "No Phone",
        policies: 0,
        totalPremium: 0,
        joinDate: new Date(customer.createdAt).toISOString().split("T")[0],
      };

      setCustomers([...customers, newCustomerData]);

      toast.success(`Customer ${name} added successfully!`);
      closeAddCustomerModal();

      // Refresh customers to ensure accurate data
      fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create customer";
      toast.error(errorMessage);
    }
  };

  const handlePolicyInputChange = (e) => {
    const { name, value } = e.target;
    setNewPolicy({
      ...newPolicy,
      [name]: value,
    });

    // Check if policy number is unique after user stops typing
    if (name === "policyNumber" && value.trim() !== "") {
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

      if (response.data.exists) {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setPolicyDocument(selectedFile);
    } else {
      toast.error("Please select a PDF file");
      e.target.value = "";
      setPolicyDocument(null);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();

    try {
      const {
        title,
        description,
        premium,
        startDate,
        renewalDate,
        policyNumber,
        mobileNo,
        sumAssured,
        companyName,
      } = newPolicy;

      // Validate form fields
      if (
        !title ||
        !description ||
        !premium ||
        !startDate ||
        !renewalDate ||
        !policyNumber ||
        !mobileNo ||
        !sumAssured ||
        !companyName
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Check if policy number is unique before submission
      if (policyNumberError) {
        toast.error(policyNumberError);
        return;
      }

      // Create policy with API
      const response = await axios.post("/api/policies", {
        title,
        description,
        premium: parseFloat(premium),
        startDate,
        renewalDate,
        customerID: selectedCustomer.id,
        policyNumber,
        mobileNo,
        sumAssured: parseFloat(sumAssured),
        companyName,
      });

      const createdPolicy = response.data.data;

      // If there's a document to upload, upload it
      if (policyDocument) {
        try {
          setUploadingDocument(true);

          const formData = new FormData();
          formData.append("policyDocument", policyDocument);

          await axios.post(
            `/api/policies/${createdPolicy._id}/document`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          toast.success("Policy document uploaded successfully");
        } catch (uploadError) {
          console.error("Error uploading policy document:", uploadError);
          toast.error(
            "Failed to upload policy document. You can upload it later."
          );
        } finally {
          setUploadingDocument(false);
        }
      }

      toast.success(`Policy created for ${selectedCustomer.name}`);
      closeAddPolicyModal();

      // Reset form
      setNewPolicy({
        title: "",
        description: "",
        premium: "",
        startDate: "",
        renewalDate: "",
        policyNumber: "",
        mobileNo: "",
        sumAssured: "",
        companyName: "OTHER",
      });
      setPolicyDocument(null);
      setPolicyNumberError("");

      // Refresh customer data to update policy count and premium
      fetchCustomers();
    } catch (error) {
      console.error("Error creating policy:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create policy";
      toast.error(errorMessage);
    }
  };

  const closeEditCustomerModal = () => {
    setIsEditCustomerModalOpen(false);
    setEditedCustomer(null);
  };

  const handleEditCustomer = (customer) => {
    setEditedCustomer({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone === "No Phone" ? "" : customer.phone,
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleEditCustomerInputChange = (e) => {
    setEditedCustomer({
      ...editedCustomer,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();

    try {
      const { id, name, email, phone } = editedCustomer;

      // Validate form fields
      if (!name || !email) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Send request to update customer
      const response = await axios.put(`/api/customers/${id}`, {
        name,
        email,
        phone: phone === "No Phone" ? "" : phone, // Convert "No Phone" display text to empty string for API
      });

      toast.success("Customer updated successfully!");
      closeEditCustomerModal();
      closeModal(); // Close the customer details modal too

      // Refresh customer data to show updated information
      fetchCustomers();
    } catch (error) {
      console.error("Error updating customer:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update customer";
      toast.error(errorMessage);
    }
  };

  const handleViewPolicies = async (customer) => {
    try {
      setPoliciesLoading(true);
      setSelectedCustomer(customer);

      const response = await axios.get(
        `/api/customers/${customer.id}/policies`
      );

      // Format policy data for display
      const formattedPolicies = response.data.data.map((policy) => {
        return {
          id: policy._id,
          title: policy.title,
          description: policy.description,
          premium: policy.premium,
          startDate: new Date(policy.startDate).toISOString().split("T")[0],
          renewalDate: new Date(policy.renewalDate).toISOString().split("T")[0],
          policyNumber: `POL-${policy._id.substring(0, 8)}`,
          isActive: policy.isActive,
        };
      });

      setCustomerPolicies(formattedPolicies);
      setPoliciesLoading(false);

      // Open modal AFTER data is loaded
      setIsViewPoliciesModalOpen(true);
    } catch (error) {
      console.error("Error fetching customer policies:", error);
      toast.error("Failed to load customer policies");
      setPoliciesLoading(false);
    }
  };

  const closeViewPoliciesModal = () => {
    setIsViewPoliciesModalOpen(false);
    setCustomerPolicies([]);
    setPolicySearchQuery("");
  };

  // Define policy columns for the customer policies modal
  const policyColumns = [
    {
      header: "ID",
      accessor: "policyNumber",
    },
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Premium",
      accessor: "premium",
      render: (row) => `₹${row.premium.toLocaleString()}`,
    },
    {
      header: "Start Date",
      accessor: "startDate",
      render: (row) => new Date(row.startDate).toLocaleDateString(),
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
              handleTogglePolicyStatus(row);
            }}
            className={`${
              row.isActive
                ? "text-orange-600 hover:text-orange-800"
                : "text-green-600 hover:text-green-800"
            }`}
          >
            {row.isActive ? "Deactivate" : "Activate"}
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

  // Filter customer policies based on search query
  const filteredPolicies = customerPolicies.filter(
    (policy) =>
      policy.title.toLowerCase().includes(policySearchQuery.toLowerCase()) ||
      policy.policyNumber
        .toLowerCase()
        .includes(policySearchQuery.toLowerCase())
  );

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePolicy = async (policy) => {
    if (
      window.confirm(
        `Are you sure you want to delete policy ${policy.policyNumber}?`
      )
    ) {
      try {
        // Add log to debug the request
        // console.log("Deleting policy with ID:", policy.id);

        const response = await axios.delete(`/api/policies/${policy.id}`);
        // console.log("Delete response:", response);

        toast.success(`Policy ${policy.policyNumber} deleted successfully`);

        // Remove the deleted policy from the local state
        setCustomerPolicies(customerPolicies.filter((p) => p.id !== policy.id));

        // Update the customer's policy count in the customers list
        const updatedCustomers = customers.map((c) => {
          if (c.id === selectedCustomer.id) {
            return {
              ...c,
              policies: c.policies - 1,
              totalPremium: c.totalPremium - policy.premium,
            };
          }
          return c;
        });

        setCustomers(updatedCustomers);

        // Update the selected customer's policy count
        setSelectedCustomer({
          ...selectedCustomer,
          policies: selectedCustomer.policies - 1,
          totalPremium: selectedCustomer.totalPremium - policy.premium,
        });
      } catch (error) {
        console.error("Error deleting policy:", error);
        // More detailed error message
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : error.message || "Failed to delete policy";

        toast.error(`Failed to delete policy: ${errorMessage}`);
      }
    }
  };

  const openLinkToExistingModal = () => {
    setCustomerSearchQuery("");
    setAllCustomers([]);
    setSelectedExistingCustomerId("");
    setIsLinkToExistingModalOpen(true);
  };

  const closeLinkToExistingModal = () => {
    setIsLinkToExistingModalOpen(false);
    setCustomerSearchQuery("");
    setAllCustomers([]);
    setSelectedExistingCustomerId("");
  };

  const handleLinkToExistingCustomer = async () => {
    if (!selectedExistingCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    try {
      const response = await axios.post(
        `/api/agents/me/link-customer/${selectedExistingCustomerId}`
      );

      toast.success(response.data.message || "Successfully linked to customer");

      // Refresh the customers list
      fetchCustomers();

      // Close the modal
      closeLinkToExistingModal();
    } catch (error) {
      console.error("Error linking to customer:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to link to customer";
      toast.error(errorMessage);
    }
  };

  const handleSearchCustomers = (e) => {
    e.preventDefault();
    if (customerSearchQuery.trim().length < 3) {
      toast.warn("Please enter at least 3 characters to search");
      return;
    }

    fetchAllCustomers();
  };

  const handleDeleteCustomer = async (customer) => {
    if (
      window.confirm(
        `Are you sure you want to delete customer ${customer.name}?\n\nThis will permanently delete the customer account and all inactive policies. Active policies must be deactivated first.`
      )
    ) {
      try {
        // Call the agent endpoint for deleting customers
        const response = await axios.delete(
          `/api/agents/customers/${customer.id}`
        );

        toast.success(
          response.data.message ||
            `Customer ${customer.name} deleted successfully`
        );

        // Remove the deleted customer from the local state
        const updatedCustomers = customers.filter((c) => c.id !== customer.id);
        setCustomers(updatedCustomers);
      } catch (error) {
        console.error("Error deleting customer:", error);

        // Handle specific error for active policies
        if (
          error.response?.status === 400 &&
          error.response?.data?.activePoliciesCount
        ) {
          const count = error.response.data.activePoliciesCount;
          toast.error(
            `Cannot delete customer with ${count} active ${
              count === 1 ? "policy" : "policies"
            }. Please deactivate all policies first.`
          );
        } else {
          // Generic error message
          const errorMessage =
            error.response?.data?.message || "Failed to delete customer";
          toast.error(errorMessage);
        }
      }
    }
  };

  const handleTogglePolicyStatus = async (policy) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          policy.isActive ? "deactivate" : "activate"
        } policy ${policy.policyNumber}?`
      )
    ) {
      try {
        // Call the agent endpoint for toggling policy status
        const response = await axios.put(
          `/api/policies/${policy.id}/toggle-status`
        );

        toast.success(
          response.data.message || "Policy status updated successfully"
        );

        // Update the policy status in the local state
        const updatedPolicies = customerPolicies.map((p) =>
          p.id === policy.id ? { ...p, isActive: !policy.isActive } : p
        );
        setCustomerPolicies(updatedPolicies);

        // Update the customer's policy count and total premium in the customers list
        const updatedCustomers = customers.map((c) => {
          if (c.id === selectedCustomer.id) {
            return {
              ...c,
              policies: c.policies + (policy.isActive ? -1 : 1),
              totalPremium:
                c.totalPremium -
                (policy.isActive ? policy.premium : -policy.premium),
            };
          }
          return c;
        });
        setCustomers(updatedCustomers);

        // Update the selected customer's policy count and total premium
        setSelectedCustomer({
          ...selectedCustomer,
          policies: selectedCustomer.policies + (policy.isActive ? -1 : 1),
          totalPremium:
            selectedCustomer.totalPremium -
            (policy.isActive ? policy.premium : -policy.premium),
        });
      } catch (error) {
        console.error("Error toggling policy status:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to toggle policy status";
        toast.error(errorMessage);
      }
    }
  };

  // Generate a unique username that doesn't already exist
  const generateUniqueUsername = async (fullName) => {
    const initialUsername = generateUsername(fullName);

    try {
      // Check if the initial username exists
      const exists = await checkUsernameExists(initialUsername);

      if (!exists) {
        return initialUsername;
      } else {
        // Try with additional random digits until we find a unique one
        for (let i = 0; i < 5; i++) {
          const altUsername =
            initialUsername + Math.floor(10 + Math.random() * 90);
          const altExists = await checkUsernameExists(altUsername);

          if (!altExists) {
            return altUsername;
          }
        }

        // If all attempts failed, use a more random approach
        return initialUsername + Date.now().toString().slice(-4);
      }
    } catch (error) {
      console.error("Error checking username:", error);
      // In case of error, add timestamp to make it more likely to be unique
      return initialUsername + Date.now().toString().slice(-4);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Customers</h2>
          <div className="flex space-x-2">
            <button
              onClick={openLinkToExistingModal}
              className="btn btn-secondary"
            >
              Link to Existing Customer
            </button>
            <button
              onClick={() => setIsAddCustomerModalOpen(true)}
              className="btn btn-primary"
            >
              Add New Customer
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <DataTable
          columns={customerColumns}
          data={filteredCustomers}
          loading={loading}
          onRowClick={handleViewCustomer}
          emptyMessage="No customers found"
        />
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Customer Details"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold dark:text-white">
                {selectedCustomer.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Customer since{" "}
                {new Date(selectedCustomer.joinDate).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </h4>
                <p className="dark:text-white">{selectedCustomer.email}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </h4>
                <p className="dark:text-white">{selectedCustomer.phone}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Policies
                </h4>
                <p className="dark:text-white">{selectedCustomer.policies}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Premium
                </h4>
                <p className="dark:text-white">
                  {selectedCustomer.totalPremium
                    ? selectedCustomer.totalPremium.toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => {
                  closeModal();
                  handleAddPolicy(selectedCustomer);
                }}
                className="btn btn-primary"
              >
                Add New Policy
              </button>
              <button
                onClick={() => {
                  closeModal();
                  handleEditCustomer(selectedCustomer);
                }}
                className="btn btn-outline"
              >
                Edit Customer
              </button>
              <button
                onClick={() => {
                  closeModal();
                  handleViewPolicies(selectedCustomer);
                }}
                className="btn btn-secondary"
              >
                View All Policies
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Policy Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isAddPolicyModalOpen}
          onClose={closeAddPolicyModal}
          title={`Add Policy for ${selectedCustomer.name}`}
          size="lg"
        >
          <form onSubmit={handleCreatePolicy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="policyNumber"
                  className="form-label dark:text-gray-300"
                >
                  Policy Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="policyNumber"
                    name="policyNumber"
                    type="text"
                    value={newPolicy.policyNumber}
                    onChange={handlePolicyInputChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      policyNumberError ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none ${
                      policyNumberError
                        ? "focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-primary-500 focus:border-primary-500"
                    }`}
                    required
                  />
                  {checkingPolicyNumber && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <FaSpinner className="animate-spin h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                {policyNumberError && (
                  <p className="mt-1 text-sm text-red-600">
                    {policyNumberError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="companyName"
                  className="form-label dark:text-gray-300"
                >
                  Insurance Company <span className="text-red-500">*</span>
                </label>
                <select
                  id="companyName"
                  name="companyName"
                  value={newPolicy.companyName}
                  onChange={handlePolicyInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Insurance Company</option>
                  <option value="HDFC ERGO">HDFC ERGO</option>
                  <option value="HDFC LIFE">HDFC LIFE</option>
                  <option value="LIC">LIC</option>
                  <option value="STAR HEALTH">STAR HEALTH</option>
                  <option value="CARE HEALTH">CARE HEALTH</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="title" className="form-label dark:text-gray-300">
                Policy Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={newPolicy.title}
                onChange={handlePolicyInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="form-label dark:text-gray-300"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={newPolicy.description}
                onChange={handlePolicyInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="mobileNo"
                  className="form-label dark:text-gray-300"
                >
                  Contact Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="mobileNo"
                  name="mobileNo"
                  type="text"
                  value={newPolicy.mobileNo}
                  onChange={handlePolicyInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="sumAssured"
                  className="form-label dark:text-gray-300"
                >
                  Sum Assured (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="sumAssured"
                  name="sumAssured"
                  type="number"
                  min="0"
                  step="1"
                  value={newPolicy.sumAssured}
                  onChange={handlePolicyInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="premium"
                className="form-label dark:text-gray-300"
              >
                Premium Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="premium"
                name="premium"
                type="number"
                min="0"
                step="1"
                value={newPolicy.premium}
                onChange={handlePolicyInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="form-label dark:text-gray-300"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={newPolicy.startDate}
                  onChange={handlePolicyInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="renewalDate"
                  className="form-label dark:text-gray-300"
                >
                  Renewal Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="renewalDate"
                  name="renewalDate"
                  type="date"
                  value={newPolicy.renewalDate}
                  onChange={handlePolicyInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="policyDocument"
                className="form-label dark:text-gray-300"
              >
                Policy Document (PDF)
              </label>
              <input
                id="policyDocument"
                name="policyDocument"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload the policy document in PDF format (optional)
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={closeAddPolicyModal}
                className="btn btn-outline"
                disabled={uploadingDocument}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploadingDocument}
              >
                {uploadingDocument ? "Creating Policy..." : "Create Policy"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={closeAddCustomerModal}
        title="Add New Customer"
        size="lg"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label htmlFor="name" className="form-label dark:text-gray-300">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={newCustomer.name}
              onChange={handleCustomerInputChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="form-label dark:text-gray-300">
              Username
            </label>
            <div className="flex space-x-2">
              <input
                id="username"
                name="username"
                type="text"
                value={newCustomer.username}
                onChange={handleCustomerInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newCustomer.name) {
                    toast.warning("Please enter a name first");
                    return;
                  }
                  try {
                    const uniqueUsername = await generateUniqueUsername(
                      newCustomer.name
                    );
                    setNewCustomer({
                      ...newCustomer,
                      username: uniqueUsername,
                    });
                    toast.success(`Generated username: ${uniqueUsername}`);
                  } catch (error) {
                    console.error("Error generating username:", error);
                    toast.error("Failed to generate a unique username");
                  }
                }}
                className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                title="Generate username from name"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="form-label dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={newCustomer.email}
              onChange={handleCustomerInputChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="form-label dark:text-gray-300">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={newCustomer.phone}
              onChange={handleCustomerInputChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label dark:text-gray-300">
              Initial Password
            </label>
            <div className="flex space-x-2">
              <PasswordInputWithEye
                id="password"
                name="password"
                value={newCustomer.password}
                onChange={handleCustomerInputChange}
                required
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                title="Generate secure password"
              >
                Generate
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Customer will be able to change their password after first login.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeAddCustomerModal}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      {editedCustomer && (
        <Modal
          isOpen={isEditCustomerModalOpen}
          onClose={closeEditCustomerModal}
          title="Edit Customer"
          size="lg"
        >
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label dark:text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={editedCustomer.name}
                onChange={handleEditCustomerInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={editedCustomer.email}
                onChange={handleEditCustomerInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="form-label dark:text-gray-300">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={editedCustomer.phone}
                onChange={handleEditCustomerInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={closeEditCustomerModal}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Customer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Customer Policies Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isViewPoliciesModalOpen}
          onClose={closeViewPoliciesModal}
          title={`${selectedCustomer.name}'s Policies`}
          size="xl"
        >
          <div className="space-y-4">
            {/* Search policies */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search policies by title or ID..."
                  value={policySearchQuery}
                  onChange={(e) => setPolicySearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {policiesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <DataTable
                columns={policyColumns}
                data={filteredPolicies}
                emptyMessage="No policies found for this customer"
              />
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <div>
                <span className="text-gray-700">
                  Total Policies:{" "}
                  <span className="font-medium">{customerPolicies.length}</span>
                </span>
                <span className="ml-4 text-gray-700">
                  Total Premium:
                  <span className="font-medium">
                    ₹
                    {customerPolicies
                      .reduce((sum, policy) => sum + policy.premium, 0)
                      .toLocaleString()}
                  </span>
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    closeViewPoliciesModal();
                    handleAddPolicy(selectedCustomer);
                  }}
                  className="btn btn-primary"
                >
                  Add New Policy
                </button>
                <button
                  onClick={closeViewPoliciesModal}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Link to Existing Customer Modal */}
      <Modal
        isOpen={isLinkToExistingModalOpen}
        onClose={closeLinkToExistingModal}
        title="Link to Existing Customer"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300">
            Search for an existing customer in the system to link to your
            account. This will allow you to create policies for them.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearchCustomers} className="flex space-x-2">
            <input
              type="text"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="flex-grow appearance-none block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                customerSearchQuery.trim().length < 3 || loadingAllCustomers
              }
            >
              Search
            </button>
          </form>

          {/* Results */}
          {loadingAllCustomers ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Searching for customers...</span>
            </div>
          ) : allCustomers.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2 dark:text-white">
                Search Results
              </h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allCustomers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="radio"
                            name="selectedCustomer"
                            value={customer._id}
                            checked={
                              selectedExistingCustomerId === customer._id
                            }
                            onChange={() =>
                              setSelectedExistingCustomerId(customer._id)
                            }
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.userID?.name || "No Name"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.userID?.email || "No Email"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.userID?.username || "No Username"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : customerSearchQuery.trim().length >= 3 ? (
            <div className="text-center py-6 text-gray-500">
              No customers found matching your search criteria.
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={closeLinkToExistingModal}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleLinkToExistingCustomer}
              className="btn btn-primary"
              disabled={!selectedExistingCustomerId || loadingAllCustomers}
            >
              Link to Customer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentCustomers;
