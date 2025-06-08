import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, loading } = useContext(AuthContext);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await forgotPassword(email);
    if (success) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Check Your Email
        </h2>
        <p className="mb-6 text-gray-600">
          We've sent a password reset link to <strong>{email}</strong>. Please
          check your inbox and follow the instructions to reset your password.
        </p>
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
        Reset your password
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="form-label">
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? <LoadingSpinner /> : "Send Reset Link"}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Back to login
        </Link>
      </div>
    </>
  );
};

export default ForgotPassword;
