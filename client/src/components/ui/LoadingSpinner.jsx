import React, { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

const LoadingSpinner = ({ fullScreen = false, size = "default" }) => {
  const { darkMode } = useContext(ThemeContext);

  const sizeClasses = {
    small: "w-4 h-4 border-2",
    default: "w-8 h-8 border-4",
    large: "w-12 h-12 border-4",
  };

  const spinnerClasses = `inline-block ${sizeClasses[size]} ${
    darkMode
      ? "border-t-primary-500 border-r-primary-500 border-b-primary-800 border-l-primary-800"
      : "border-t-primary-600 border-r-primary-600 border-b-primary-200 border-l-primary-200"
  } rounded-full animate-spin`;

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 ${
          darkMode ? "bg-gray-900 bg-opacity-75" : "bg-white bg-opacity-75"
        }`}
      >
        <div className={spinnerClasses}></div>
      </div>
    );
  }

  return <div className={spinnerClasses}></div>;
};

export default LoadingSpinner;
