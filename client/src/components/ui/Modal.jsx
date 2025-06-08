import React, { useEffect, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import { ThemeContext } from "../../context/ThemeContext";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const { darkMode } = useContext(ThemeContext);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto"; // Re-enable scrolling when modal is closed
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className={`fixed inset-0 transition-opacity ${
            darkMode ? "bg-black bg-opacity-80" : "bg-gray-500 bg-opacity-75"
          }`}
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div
          className={`inline-block overflow-hidden text-left align-bottom transition-all transform rounded-lg shadow-xl sm:my-8 sm:align-middle sm:w-full sm:p-6 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
          style={{ maxWidth: "95%" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${sizeClasses[size]}`}>
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-medium leading-6 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {title}
              </h3>
              <button
                type="button"
                className={`${
                  darkMode
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-400 hover:text-gray-500"
                } focus:outline-none`}
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <FaTimes className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
