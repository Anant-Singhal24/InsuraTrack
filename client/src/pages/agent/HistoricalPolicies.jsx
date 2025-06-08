import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import { FaFilter, FaSearch } from "react-icons/fa";
import React from "react";

const HistoricalPolicies = () => {
  const [historicalPolicies, setHistoricalPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    changeType: "renewal", // Default filter for renewal events
    sortBy: "createdAt", // Default sort by creation date (when renewal happened)
    sortOrder: "desc", // Default descending order (newest first)
  });

  useEffect(() => {
    fetchHistoricalPolicies();
  }, []);

  // Add filtered policies for the local search functionality
  const filteredHistoricalPolicies = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return historicalPolicies;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    return historicalPolicies.filter(
      (policy) =>
        policy.title.toLowerCase().includes(lowerCaseQuery) ||
        policy.policyNumber.toLowerCase().includes(lowerCaseQuery) ||
        policy.companyName.toLowerCase().includes(lowerCaseQuery) ||
        policy.customerName.toLowerCase().includes(lowerCaseQuery) ||
        policy.changedBy.toLowerCase().includes(lowerCaseQuery)
    );
  }, [searchQuery, historicalPolicies]);

  const fetchHistoricalPolicies = async (useFilters = true) => {
    try {
      setLoading(true);

      let endpoint = "/api/policies/historical";
      let params = {};

      // Apply filters for API endpoint
      if (useFilters) {
        // Only add filters with values
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            params[key] = value;
          }
        });

        // Add search query if present
        if (searchQuery) {
          params.query = searchQuery; // Changed from policyNumber to query for better search
        }
      }

      // console.log("Fetching historical policies with params:", params);
      const response = await axios.get(endpoint, { params });

      // Transform data to match our expected format
      const formattedPolicies = response.data.data.map((history) => {
        const customerName =
          history.customerID?.userID?.name || "Unknown Customer";
        const customerEmail = history.customerID?.userID?.email || "";
        const changedByName = history.changedBy?.name || "System";

        return {
          id: history._id,
          historyId: history._id,
          policyId: history.policyID?._id,
          title: history.title,
          description: history.description,
          premium: history.premium,
          startDate: new Date(history.startDate).toISOString().split("T")[0],
          renewalDate: new Date(history.renewalDate)
            .toISOString()
            .split("T")[0],
          customerName,
          customerEmail,
          policyNumber:
            history.policyNumber ||
            `POL-${history.policyID?._id?.substring(0, 8) || "UNKNOWN"}`,
          companyName: history.companyName || "OTHER",
          mobileNo: history.mobileNo || "N/A",
          sumAssured: history.sumAssured || 0,
          changeType: history.changeType,
          changedBy: changedByName,
          changedDate: new Date(history.createdAt).toISOString().split("T")[0],
          notes: history.notes || "",
          isActive: history.policyID?.isActive !== false,
        };
      });

      setHistoricalPolicies(formattedPolicies);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching History:", error);
      toast.error("Failed to load History");
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    // console.log("Applying filters:", filters);
    fetchHistoricalPolicies(true);
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
      changeType: "renewal",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    fetchHistoricalPolicies(false);
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
      header: "Coverage Period",
      accessor: "startDate",
      render: (row) =>
        `${new Date(row.startDate).toLocaleDateString()} - ${new Date(
          row.renewalDate
        ).toLocaleDateString()}`,
    },
    {
      header: "Changed Date",
      accessor: "changedDate",
      render: (row) => new Date(row.changedDate).toLocaleDateString(),
    },
    {
      header: "Change Type",
      accessor: "changeType",
      render: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.changeType === "renewal"
              ? "bg-green-100 text-green-800"
              : row.changeType === "update"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.changeType.charAt(0).toUpperCase() + row.changeType.slice(1)}
        </span>
      ),
    },
    {
      header: "Changed By",
      accessor: "changedBy",
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteHistory(row);
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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
  };

  const handleDeleteHistory = (policy) => {
    if (
      window.confirm(
        `Are you sure you want to delete this historical record for policy ${policy.policyNumber}? This action cannot be undone.`
      )
    ) {
      deleteHistoricalPolicy(policy.historyId);
    }
  };

  const deleteHistoricalPolicy = async (historyId) => {
    try {
      await axios.delete(`/api/policies/historical/${historyId}`);
      toast.success("Historical policy record deleted successfully");

      // Remove the deleted policy from the local state
      setHistoricalPolicies(
        historicalPolicies.filter((p) => p.historyId !== historyId)
      );
    } catch (error) {
      console.error("Error deleting historical policy record:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete record";
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">History</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="btn btn-outline flex items-center"
            >
              <FaFilter className="h-5 w-5 mr-1" />
              Advanced Filter
            </button>
          </div>
        </div>

        <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span> This page shows the
            history of all policy renewals and updates. You can delete
            historical records if needed, but this will not affect the current
            active policies.
          </p>
        </div>


        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search by policy number, customer name, or company..."
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
          data={filteredHistoricalPolicies}
          loading={loading}
          onRowClick={handleViewPolicy}
          emptyMessage="No History found"
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
              <label htmlFor="companyName" className="form-label">
                Insurance Company
              </label>
              <select
                id="companyName"
                name="companyName"
                value={filters.companyName}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
              <label htmlFor="changeType" className="form-label">
                Change Type
              </label>
              <select
                id="changeType"
                name="changeType"
                value={filters.changeType}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="renewal">Renewals Only</option>
                <option value="update">Updates Only</option>
                <option value="">All Changes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="renewalMonth" className="form-label">
                Renewal Month
              </label>
              <select
                id="renewalMonth"
                name="renewalMonth"
                value={filters.renewalMonth}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
              <label htmlFor="renewalYear" className="form-label">
                Renewal Year
              </label>
              <select
                id="renewalYear"
                name="renewalYear"
                value={filters.renewalYear}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Any Year</option>
                {/* Generate options for current year and previous 5 years */}
                {Array.from({ length: 6 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium mb-2">Date Ranges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="startDateFrom"
                      className="form-label text-xs"
                    >
                      From
                    </label>
                    <input
                      id="startDateFrom"
                      name="startDateFrom"
                      type="date"
                      value={filters.startDateFrom}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="startDateTo" className="form-label text-xs">
                      To
                    </label>
                    <input
                      id="startDateTo"
                      name="startDateTo"
                      type="date"
                      value={filters.startDateTo}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Renewal Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="renewalDateFrom"
                      className="form-label text-xs"
                    >
                      From
                    </label>
                    <input
                      id="renewalDateFrom"
                      name="renewalDateFrom"
                      type="date"
                      value={filters.renewalDateFrom}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="renewalDateTo"
                      className="form-label text-xs"
                    >
                      To
                    </label>
                    <input
                      id="renewalDateTo"
                      name="renewalDateTo"
                      type="date"
                      value={filters.renewalDateTo}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium mb-2">Amount Ranges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Premium Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="minPremium" className="form-label text-xs">
                      Min $
                    </label>
                    <input
                      id="minPremium"
                      name="minPremium"
                      type="number"
                      min="0"
                      step="1"
                      value={filters.minPremium}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxPremium" className="form-label text-xs">
                      Max $
                    </label>
                    <input
                      id="maxPremium"
                      name="maxPremium"
                      type="number"
                      min="0"
                      step="1"
                      value={filters.maxPremium}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Sum Assured Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="minSumAssured"
                      className="form-label text-xs"
                    >
                      Min ₹
                    </label>
                    <input
                      id="minSumAssured"
                      name="minSumAssured"
                      type="number"
                      min="0"
                      step="1"
                      value={filters.minSumAssured}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="maxSumAssured"
                      className="form-label text-xs"
                    >
                      Max $
                    </label>
                    <input
                      id="maxSumAssured"
                      name="maxSumAssured"
                      type="number"
                      min="0"
                      step="1"
                      value={filters.maxSumAssured}
                      onChange={handleFilterChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium mb-2">Sort Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sortBy" className="form-label">
                  Sort By
                </label>
                <select
                  id="sortBy"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="createdAt">Change Date</option>
                  <option value="renewalDate">Renewal Date</option>
                  <option value="startDate">Start Date</option>
                  <option value="premium">Premium Amount</option>
                  <option value="sumAssured">Sum Assured</option>
                  <option value="companyName">Company Name</option>
                  <option value="title">Policy Title</option>
                  <option value="policyNumber">Policy Number</option>
                </select>
              </div>

              <div>
                <label htmlFor="sortOrder" className="form-label">
                  Order
                </label>
                <select
                  id="sortOrder"
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline"
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
        </div>
      </Modal>

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Historical Policy Details"
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
                  selectedPolicy.changeType === "renewal"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                }`}
              >
                {selectedPolicy.changeType.charAt(0).toUpperCase() +
                  selectedPolicy.changeType.slice(1)}
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
                <p className="dark:text-white">
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

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-2 dark:text-white">
                Change Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Changed By
                  </p>
                  <p className="dark:text-white">{selectedPolicy.changedBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Changed Date
                  </p>
                  <p className="dark:text-white">
                    {new Date(selectedPolicy.changedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {selectedPolicy.notes && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-2 dark:text-white">Notes</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedPolicy.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => {
                  closeModal();
                  handleDeleteHistory(selectedPolicy);
                }}
                className="btn btn-danger"
              >
                Delete Record
              </button>
              <button onClick={closeModal} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HistoricalPolicies;
