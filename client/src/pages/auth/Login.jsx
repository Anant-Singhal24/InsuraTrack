import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PasswordInputWithEye from "../../components/ui/PasswordInputWithEye";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const { login, loading } = useContext(AuthContext);

  const { username, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Sign in to your account
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          <label htmlFor="password" className="form-label dark:text-gray-300">
            Password
          </label>
          <PasswordInputWithEye
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? <LoadingSpinner size="small" /> : "Sign in"}
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
              Insurance Agent Registration
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/register"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-primary-600 dark:text-primary-400"
          >
            Register as Agent
          </Link>
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            Are you a customer? Your insurance agent will create an account for
            you.
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
