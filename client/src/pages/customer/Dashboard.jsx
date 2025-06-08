import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import DashboardCard from "../../components/ui/DashboardCard";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  FaFileAlt,
  FaCheckCircle,
  FaMoneyBillWave,
  FaClock,
  FaPhone,
} from "react-icons/fa";

const CustomerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    policies: 0,
    activePolicies: 0,
    totalPremium: 0,
    dueRenewals: 0,
  });
  const [myPolicies, setMyPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get customer profile
        const customerResponse = await axios.get("/api/customers/me");
        const customer = customerResponse.data.data;

        // Get customer policies
        const policiesResponse = await axios.get(
          `/api/customers/${customer._id}/policies`
        );
        const policies = policiesResponse.data.data || [];

        // Calculate statistics
        const totalPolicies = policies.length;
        const activePolicies = policies.filter(
          (policy) => policy.isActive
        ).length;
        const totalPremium = policies.reduce(
          (sum, policy) => sum + policy.premium,
          0
        );

        // Find policies with renewal dates in the next 30 days
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const dueRenewals = policies.filter((policy) => {
          const renewalDate = new Date(policy.renewalDate);
          return renewalDate >= now && renewalDate <= thirtyDaysFromNow;
        }).length;

        // Update stats
        setStats({
          policies: totalPolicies,
          activePolicies,
          totalPremium,
          dueRenewals,
        });

        // Format policy data for display in the table
        const formattedPolicies = policies.map((policy) => {
          // Get agent name if available
          const agentName = policy.agentID?.userID?.name || "No Agent";

          return {
            id: policy._id,
            title: policy.title,
            premium: policy.premium,
            startDate: new Date(policy.startDate).toISOString().split("T")[0],
            renewalDate: new Date(policy.renewalDate)
              .toISOString()
              .split("T")[0],
            agentName,
            isActive: policy.isActive,
          };
        });

        // Sort policies by renewal date (soonest first) and take only the first 5 for the dashboard
        const sortedPolicies = formattedPolicies
          .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
          .slice(0, 5);

        setMyPolicies(sortedPolicies);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const policyColumns = [
    {
      header: "Policy",
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
      header: "Agent",
      accessor: "agentName",
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
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome, {user.name}!
        </h2>
        <p className="text-gray-600 mt-1">
          Here's an overview of your insurance policies.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="My Policies"
          value={stats.policies}
          icon={<FaFileAlt className="w-6 h-6 text-green-600" />}
          color="border-green-500"
          link="/customer/policies"
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
          title="Due Renewals"
          value={stats.dueRenewals}
          icon={<FaClock className="w-6 h-6 text-red-600" />}
          color="border-red-500"
        />
      </div>

      {/* My Policies */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Policies</h2>
          <Link
            to="/customer/policies"
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            View All
          </Link>
        </div>
        <DataTable
          columns={policyColumns}
          data={myPolicies}
          loading={loading}
          onRowClick={(policy) => toast.info(`Policy ID: ${policy.id}`)}
          emptyMessage="You don't have any policies yet"
        />
      </div>

      {/* Contact Agent */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Need Assistance?
        </h2>
        <p className="text-gray-600 mb-4">
          Contact your agent for any questions about your policies or to discuss
          new coverage options.
        </p>
        <button
          onClick={() => navigate("/customer/contact-agent")}
          className="btn btn-primary flex items-center"
        >
          <FaPhone className="w-5 h-5 mr-2" />
          Contact My Agent
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
