import React, { useState, useContext } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { ThemeContext } from "../../context/ThemeContext";

const DataTable = ({
  columns,
  data,
  loading = false,
  onRowClick,
  pagination = false,
  itemsPerPage = 10,
  emptyMessage = "No data available",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { darkMode } = useContext(ThemeContext);

  // Handle pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = pagination
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto shadow-md rounded-md">
        <table
          className={`min-w-full divide-y ${
            darkMode ? "divide-gray-700" : "divide-gray-200"
          }`}
        >
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`${
              darkMode
                ? "bg-gray-800 divide-y divide-gray-700"
                : "bg-white divide-y divide-gray-200"
            }`}
          >
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`px-6 py-4 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <LoadingSpinner />
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  } ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`px-6 py-4 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, data.length)}
            </span>{" "}
            of <span className="font-medium">{data.length}</span> results
          </div>
          <nav className="flex space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? darkMode
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-100 text-gray-400"
                  : darkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              return (
                <button
                  key={idx}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page
                      ? "bg-primary-600 text-white"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? darkMode
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-100 text-gray-400"
                  : darkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DataTable;
