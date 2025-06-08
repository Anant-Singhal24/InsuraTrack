import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const ContactAgent = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [previousMessages, setPreviousMessages] = useState([]);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for policy information passed from the Policies page
  useEffect(() => {
    if (location.state) {
      // Set subject if provided
      if (location.state.subject) {
        setSubject(location.state.subject);
      }

      // Add policy info to message if provided
      if (location.state.policyInfo) {
        setMessage(`${location.state.policyInfo}\n\n`);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);

        // Get customer profile first to find linked agents
        const customerResponse = await axios.get("/api/customers/me");
        const customer = customerResponse.data.data;

        if (customer.linkedAgentIDs && customer.linkedAgentIDs.length > 0) {
          // Format the agent data - improved extraction to ensure we get all available data
          const formattedAgents = customer.linkedAgentIDs.map((agent) => {
            // Try to access user data with multiple fallback options
            const userData = agent.userID || {};

            // Try direct access first, then userData, then fallbacks
            const name = userData.name || agent.name || "Unnamed Agent";

            // For email, check multiple possible locations
            let email = userData.email || agent.email;
            // Handle case where userID might be just the ID itself
            if (!email && agent.userID && typeof agent.userID === "string") {
              // Need to fetch the user directly if it's just an ID reference
              email = "Agent email will be available soon";
            }
            if (!email) email = "No Email Available";

            // For phone, check multiple possible locations
            let phone = userData.phone || agent.phone;
            if (!phone) phone = "No Phone Available";

            return {
              id: agent._id,
              name,
              email,
              phone,
            };
          });

          setAgents(formattedAgents);

          // Default select the first agent if available
          if (formattedAgents.length > 0) {
            setSelectedAgentId(formattedAgents[0].id);
          }
        } else {
          // If no linked agents, try to get all available agents
          try {
            const agentsResponse = await axios.get("/api/agents");
            if (
              agentsResponse.data.data &&
              agentsResponse.data.data.length > 0
            ) {
              const availableAgents = agentsResponse.data.data.map((agent) => {
                // Use same improved approach to extract agent data
                const userData = agent.userID || {};

                // Try direct access first, then userData, then fallbacks
                const name = userData.name || agent.name || "Unnamed Agent";

                // For email, check multiple possible locations
                let email = userData.email || agent.email;
                if (
                  !email &&
                  agent.userID &&
                  typeof agent.userID === "string"
                ) {
                  email = "Agent email will be available soon";
                }
                if (!email) email = "No Email Available";

                // For phone, check multiple possible locations
                let phone = userData.phone || agent.phone;
                if (!phone) phone = "No Phone Available";

                return {
                  id: agent._id,
                  name,
                  email,
                  phone,
                };
              });

              setAgents(availableAgents);

              if (availableAgents.length > 0) {
                setSelectedAgentId(availableAgents[0].id);
              }
            }
          } catch (err) {
            console.error("Error fetching available agents:", err);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching agents:", error);
        toast.error("Failed to load your agents");
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Fetch conversation history when agent changes
  useEffect(() => {
    const fetchConversation = async () => {
      if (!selectedAgentId) return;

      try {
        setFetchingMessages(true);
        const response = await axios.get(
          `/api/messages/conversation/${selectedAgentId}`
        );

        // Format messages for display
        const formattedMessages = response.data.data.map((msg) => {
          return {
            id: msg._id,
            subject: msg.subject,
            message: msg.message,
            date: new Date(msg.createdAt).toLocaleString(),
            isFromCustomer: msg.senderRole === "customer",
            isFromAgent: msg.senderRole === "agent",
          };
        });

        setPreviousMessages(formattedMessages);
        setFetchingMessages(false);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setPreviousMessages([]);
        setFetchingMessages(false);
      }
    };

    fetchConversation();
  }, [selectedAgentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAgentId) {
      toast.error("Please select an agent to contact");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      // Send the message to the backend
      await axios.post("/api/messages", {
        agentId: selectedAgentId,
        subject: subject.trim(),
        message: message.trim(),
        senderRole: "customer",
      });

      toast.success("Your message has been sent to the agent");

      // Clear form
      setMessage("");
      setSubject("");

      // Navigate back to dashboard after a delay
      setTimeout(() => {
        navigate("/customer/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send your message. Please try again.");
    }
  };

  const getSelectedAgent = () => {
    return agents.find((agent) => agent.id === selectedAgentId) || {};
  };

  const handleDeleteMessage = async (messageId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this message? This action cannot be undone."
      )
    ) {
      try {
        // Add log to debug the request
        // console.log("Deleting message with ID:", messageId);

        const response = await axios.delete(`/api/messages/${messageId}`);
        // console.log("Delete response:", response);

        toast.success("Message deleted successfully");

        // Remove the deleted message from state
        setPreviousMessages(
          previousMessages.filter((msg) => msg.id !== messageId)
        );
      } catch (error) {
        console.error("Error deleting message:", error);
        // More detailed error message
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : error.message || "Failed to delete message";

        toast.error(`Failed to delete message: ${errorMessage}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Contact Your Agent
      </h2>

      {agents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            You don't have any assigned agents yet.
          </p>
          <p className="mt-2">Please contact support for assistance.</p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <label
              htmlFor="agent"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Agent
            </label>
            <select
              id="agent"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAgentId && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-medium text-gray-800 mb-3">
                Agent Information
              </h3>
              <div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg">{getSelectedAgent().name}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{getSelectedAgent().email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-lg">{getSelectedAgent().phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Previous Conversation */}
          {previousMessages.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">
                Previous Conversation
              </h3>
              <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                <div className="p-3 space-y-3">
                  {previousMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.isFromCustomer
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-green-50 border border-green-100 ml-6"
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">
                          {msg.isFromCustomer
                            ? "You"
                            : getSelectedAgent().name || "Agent"}
                          {msg.subject && (
                            <span className="ml-2 text-gray-500">
                              - {msg.subject}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{msg.date}</p>
                      </div>
                      <div className="mt-2 bg-white p-3 rounded whitespace-pre-wrap">
                        {msg.message}
                      </div>
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-red-500 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {fetchingMessages && (
            <div className="flex justify-center my-4">
              <LoadingSpinner />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject
              </label>
              <input
                id="subject"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate("/customer/dashboard")}
                className="btn btn-outline mr-2"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send Message
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContactAgent;
