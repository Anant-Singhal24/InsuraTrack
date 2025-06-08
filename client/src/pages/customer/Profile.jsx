import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const CustomerProfile = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    linkedAgents: [],
    policies: [],
  });

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);

        // Get customer profile data
        const response = await axios.get("/api/customers/me");
        const customerProfile = response.data.data;
        // console.log(customerProfile);

        // Format customer data - get phone from userID object
        setCustomerData({
          name: customerProfile.userID?.name || "",
          email: customerProfile.userID?.email || "",
          phone: customerProfile.userID?.phone || "",
          username: customerProfile.userID?.username || "",
          linkedAgents: customerProfile.linkedAgentIDs?.length || 0,
          policies: customerProfile.policyIDs?.length || 0,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer profile:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

      {loading ? (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Username</p>
                <p className="mt-1">{customerData.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="mt-1 capitalize">Customer</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="mt-1">{customerData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Email Address
                </p>
                <p className="mt-1">{customerData.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Phone Number
                </p>
                <p className="mt-1">{customerData.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Account Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Linked Agents
                </p>
                <p className="mt-1">{customerData.linkedAgents}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Policies
                </p>
                <p className="mt-1">{customerData.policies}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
            <div>
              <a
                href="/change-password"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Change Password
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
