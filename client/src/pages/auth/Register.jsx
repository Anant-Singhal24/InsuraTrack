import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PasswordInputWithEye from "../../components/ui/PasswordInputWithEye";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "agent", // Default to agent role and don't allow changing
  });
  const { register, loading } = useContext(AuthContext);
  const [passwordError, setPasswordError] = useState("");

  const { username, name, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword: _, ...userData } = formData;
    await register(userData);
  };

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Create Agent Account
      </h2>
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Register as an insurance agent. Customers can only be added by agents
          after registration.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="form-label dark:text-gray-300">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="name" className="form-label dark:text-gray-300">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="email" className="form-label dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label dark:text-gray-300">
            Password
          </label>
          <PasswordInputWithEye
            id="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="form-label dark:text-gray-300"
          >
            Confirm Password
          </label>
          <PasswordInputWithEye
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={handleChange}
            className={passwordError ? "border-red-500" : ""}
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {passwordError}
            </p>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> You are registering as an Insurance Agent.
            After registration, you can add customers to the system.
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? <LoadingSpinner size="small" /> : "Register as Agent"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Already have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-primary-600 dark:text-primary-400"
          >
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
};

export default Register;
