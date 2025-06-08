import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DataTable from "../../components/ui/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import { FaSearch } from "react-icons/fa";

const AgentMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/messages/agent");

      // Format message data for display
      const formattedMessages = response.data.data.map((message) => {
        const customerName =
          message.customerId?.userID?.name || "Unknown Customer";
        const customerEmail = message.customerId?.userID?.email || "";

        // Format date
        const createdAt = new Date(message.createdAt);
        const formattedDate = createdAt.toLocaleDateString();
        const formattedTime = createdAt.toLocaleTimeString();

        // Format replies
        const formattedReplies = message.replies
          ? message.replies.map((reply) => {
              return {
                id: reply._id,
                message: reply.message,
                date: new Date(reply.createdAt).toLocaleString(),
                senderRole: reply.senderRole,
                isAgent: reply.senderRole === "agent",
              };
            })
          : [];

        return {
          id: message._id,
          subject: message.subject,
          message: message.message,
          customerName,
          customerEmail,
          date: `${formattedDate} at ${formattedTime}`,
          isRead: message.isRead,
          readAt: message.readAt
            ? new Date(message.readAt).toLocaleString()
            : null,
          replies: formattedReplies,
          hasReplies: formattedReplies.length > 0,
        };
      });

      setMessages(formattedMessages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
    setReplyText("");
    setIsReplying(false);

    // Mark message as read if it hasn't been read yet
    if (!message.isRead) {
      try {
        await axios.put(`/api/messages/${message.id}/read`);

        // Update the messages state to reflect the read status
        setMessages(
          messages.map((m) =>
            m.id === message.id
              ? { ...m, isRead: true, readAt: new Date().toLocaleString() }
              : m
          )
        );
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
    setReplyText("");
    setIsReplying(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();

    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setSubmittingReply(true);

      await axios.post(`/api/messages/reply/${selectedMessage.id}`, {
        message: replyText.trim(),
      });

      toast.success("Reply sent successfully");

      // Refresh messages to show the new reply
      await fetchMessages();

      // Close reply form
      setIsReplying(false);
      setReplyText("");
      setSubmittingReply(false);

      // Close modal
      closeModal();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
      setSubmittingReply(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this message and all of its replies? This action cannot be undone."
      )
    ) {
      try {
        // Add log to debug the request
        // console.log("Deleting message with ID:", selectedMessage.id);

        const response = await axios.delete(
          `/api/messages/${selectedMessage.id}`
        );
        // console.log("Delete response:", response);

        toast.success("Message deleted successfully");

        // Remove the deleted message from state
        setMessages(messages.filter((msg) => msg.id !== selectedMessage.id));

        // Close the modal
        closeModal();
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

  const messageColumns = [
    {
      header: "Status",
      accessor: "isRead",
      render: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.isRead
              ? "bg-gray-100 text-gray-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {row.isRead ? "Read" : "New"}
        </span>
      ),
    },
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "From",
      accessor: "customerName",
    },
    {
      header: "Date",
      accessor: "date",
    },
    {
      header: "Replies",
      accessor: "hasReplies",
      render: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.hasReplies
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {row.hasReplies ? "Replied" : "No Replies"}
        </span>
      ),
    },
  ];

  // Filter messages based on search query
  const filteredMessages = messages.filter(
    (message) =>
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Customer Messages</h2>
          <button onClick={fetchMessages} className="btn btn-outline">
            Refresh
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <DataTable
          columns={messageColumns}
          data={filteredMessages}
          loading={loading}
          onRowClick={handleViewMessage}
          emptyMessage="No messages found"
        />
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Message Thread"
          size="lg"
        >
          <div className="space-y-4">
            {/* Original Message */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedMessage.subject}
                  </h3>
                  <p className="text-sm text-gray-500">
                    From: {selectedMessage.customerName} (
                    {selectedMessage.customerEmail})
                  </p>
                  <p className="text-sm text-gray-500">
                    Received: {selectedMessage.date}
                  </p>
                  {selectedMessage.isRead && selectedMessage.readAt && (
                    <p className="text-sm text-gray-500">
                      Read: {selectedMessage.readAt}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedMessage.isRead
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {selectedMessage.isRead ? "Read" : "New"}
                </span>
              </div>

              <div className="mt-3">
                <div className="bg-white p-4 rounded border border-blue-100 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Replies */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  Conversation History
                </h4>
                <div className="space-y-3">
                  {selectedMessage.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg ${
                        reply.isAgent
                          ? "bg-green-50 border border-green-100 ml-6"
                          : "bg-gray-50 border border-gray-100 mr-6"
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">
                          {reply.isAgent ? "You" : selectedMessage.customerName}
                        </p>
                        <p className="text-xs text-gray-500">{reply.date}</p>
                      </div>
                      <div
                        className={`mt-2 ${
                          reply.isAgent ? "bg-white" : "bg-gray-50"
                        } p-3 rounded whitespace-pre-wrap`}
                      >
                        {reply.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Form */}
            {isReplying ? (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <form onSubmit={handleReply}>
                  <div className="mb-3">
                    <label
                      htmlFor="reply"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Reply
                    </label>
                    <textarea
                      id="reply"
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                      disabled={submittingReply}
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsReplying(false)}
                      className="btn btn-outline mr-2"
                      disabled={submittingReply}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingReply}
                    >
                      {submittingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleDeleteMessage}
                  className="btn btn-danger mr-auto"
                >
                  Delete Conversation
                </button>
                <button onClick={closeModal} className="btn btn-outline mr-2">
                  Close
                </button>
                <button
                  onClick={() => setIsReplying(true)}
                  className="btn btn-primary"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AgentMessages;
