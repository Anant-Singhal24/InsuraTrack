import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import DashboardCard from "../../components/ui/DashboardCard";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  FaUsers,
  FaFileAlt,
  FaCheckCircle,
  FaMoneyBillWave,
  FaClock,
  FaSearch,
} from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeContext";

const AgentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPolicies: 0,
    activePolicies: 0,
    totalPremium: 0,
    pendingRenewals: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [renewalSearchQuery, setRenewalSearchQuery] = useState("");
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch customers
        const customersResponse = await axios.get("/api/agents/me/customers");
        const customers = customersResponse.data.data;

        // Fetch policies
        const policiesResponse = await axios.get("/api/agents/me/policies");
        const policies = policiesResponse.data.data || [];

        // Calculate stats
        const totalCustomers = customers.length;
        const totalPolicies = policies.length;
        const activePolicies = policies.filter(
          (policy) => policy.isActive
        ).length;
        const totalPremium = policies.reduce(
          (sum, policy) => sum + policy.premium,
          0
        );

        // Find policies with renewal dates coming up in the next 60 days
        const now = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(now.getDate() + 60);

        const pendingRenewals = policies.filter((policy) => {
          const renewalDate = new Date(policy.renewalDate);
          return renewalDate >= now && renewalDate <= sixtyDaysFromNow;
        }).length;

        setStats({
          totalCustomers,
          totalPolicies,
          activePolicies,
          totalPremium,
          pendingRenewals,
        });

        // Format recent customers (limited to 5)
        const formattedCustomers = customers.slice(0, 5).map((customer) => {
          const userData = customer.userID || {};
          const customerPolicies = policies.filter(
            (policy) =>
              policy.customerID === customer._id ||
              policy.customerID._id === customer._id
          );

          const totalPremium = customerPolicies.reduce(
            (sum, policy) => sum + (policy.premium || 0),
            0
          );

          return {
            id: customer._id,
            name: userData.name || "No Name",
            email: userData.email || "No Email",
            phone: userData.phone || "No Phone",
            policies: customerPolicies.length,
            totalPremium,
            joinDate: new Date(customer.createdAt).toISOString().split("T")[0],
          };
        });

        setRecentCustomers(formattedCustomers);

        // Format upcoming renewals (limited to 5)
        const formattedRenewals = policies
          .filter((policy) => {
            const renewalDate = new Date(policy.renewalDate);
            return renewalDate >= now && renewalDate <= sixtyDaysFromNow;
          })
          .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
          .slice(0, 5)
          .map((policy) => {
            const customer = customers.find(
              (c) =>
                c._id === policy.customerID ||
                (policy.customerID && c._id === policy.customerID._id)
            );
            const customerName = customer
              ? customer.userID
                ? customer.userID.name
                : "Unknown"
              : "Unknown";

            const renewalDate = new Date(policy.renewalDate);
            const daysLeft = Math.ceil(
              (renewalDate - now) / (1000 * 60 * 60 * 24)
            );

            return {
              id: policy._id,
              policyNumber: `POL-${policy._id.substring(0, 8)}`,
              title: policy.title,
              customerName,
              premium: policy.premium,
              renewalDate: policy.renewalDate,
              daysLeft,
            };
          });

        setUpcomingRenewals(formattedRenewals);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      render: (row) => `₹${row.totalPremium.toLocaleString()}`,
    },
    {
      header: "Client Since",
      accessor: "joinDate",
      render: (row) => new Date(row.joinDate).toLocaleDateString(),
    },
  ];

  const renewalColumns = [
    {
      header: "ID",
      accessor: "policyNumber",
    },
    {
      header: "Policy",
      accessor: "title",
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
      header: "Renewal Date",
      accessor: "renewalDate",
      render: (row) => new Date(row.renewalDate).toLocaleDateString(),
    },
    {
      header: "Days Left",
      accessor: "daysLeft",
      render: (row) => (
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.daysLeft <= 14
              ? "bg-red-100 text-red-800"
              : row.daysLeft <= 30
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.daysLeft} days
        </span>
      ),
    },
  ];

  // Filter customers based on search query
  const filteredCustomers = recentCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Filter renewals based on search query
  const filteredRenewals = upcomingRenewals.filter(
    (renewal) =>
      renewal.customerName
        .toLowerCase()
        .includes(renewalSearchQuery.toLowerCase()) ||
      renewal.title.toLowerCase().includes(renewalSearchQuery.toLowerCase()) ||
      renewal.policyNumber
        .toLowerCase()
        .includes(renewalSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Message */}
      <div
        className={`${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } rounded-lg shadow-md p-6 mb-8`}
      >
        <h2 className="text-2xl font-bold mb-2">Welcome, {user.name}!</h2>
        <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Here's an overview of your customers and policies.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <DashboardCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<FaUsers className="w-6 h-6 text-blue-600" />}
          color="border-blue-500"
          link="/agent/customers"
        />
        <DashboardCard
          title="Total Policies"
          value={stats.totalPolicies}
          icon={<FaFileAlt className="w-6 h-6 text-green-600" />}
          color="border-green-500"
          link="/agent/policies"
        />
        <DashboardCard
          title="Active Policies"
          value={stats.activePolicies}
          icon={<FaCheckCircle className="w-6 h-6 text-yellow-600" />}
          color="border-yellow-500"
        />
        <DashboardCard
          title="Total Premium"
          value={`₹${stats.totalPremium.toLocaleString()}`}
          icon={<FaMoneyBillWave className="w-6 h-6 text-purple-600" />}
          color="border-purple-500"
        />
        <DashboardCard
          title="Pending Renewals"
          value={stats.pendingRenewals}
          icon={<FaClock className="w-6 h-6 text-red-600" />}
          color="border-red-500"
        />
      </div>

      {/* Recent Customers */}
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md p-6 mb-8`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Recent Customers
          </h2>
          <Link
            to="/agent/customers"
            className={`text-primary-600 hover:text-primary-800 font-medium ${
              darkMode ? "text-gray-300" : "text-gray-500"
            }`}
          >
            View All
          </Link>
        </div>

        {/* Search bar for customers */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className={`w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              placeholder="Search customers by name or email..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
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
          emptyMessage="No customers found"
        />
      </div>

      {/* Upcoming Renewals */}
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Upcoming Renewals
          </h2>
          <Link
            to="/agent/policies"
            className={`text-primary-600 hover:text-primary-800 font-medium ${
              darkMode ? "text-gray-300" : "text-gray-500"
            }`}
          >
            View All Policies
          </Link>
        </div>

        {/* Search bar for renewals */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className={`w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              placeholder="Search renewals by customer name or policy title..."
              value={renewalSearchQuery}
              onChange={(e) => setRenewalSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <DataTable
          columns={renewalColumns}
          data={filteredRenewals}
          loading={loading}
          emptyMessage="No upcoming renewals"
        />
      </div>
    </div>
  );
};

export default AgentDashboard;
