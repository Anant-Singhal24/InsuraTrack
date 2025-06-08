import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";

const DashboardCard = ({ title, value, icon, color, link }) => {
  const { darkMode } = useContext(ThemeContext);

  const cardContent = (
    <div
      className={`${
        darkMode ? "bg-gray-800 border-l-4" : "bg-white border-l-4"
      } rounded-lg shadow-md p-6 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              darkMode ? "text-gray-400" : "text-gray-500"
            } mb-1`}
          >
            {title}
          </p>
          <p
            className={`text-3xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
        <div
          className={`p-3 rounded-full ${color
            .replace("border", "bg")
            .replace("-500", "-100")} ${darkMode ? "bg-opacity-20" : ""}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{cardContent}</Link>;
  }

  return cardContent;
};

export default DashboardCard;
