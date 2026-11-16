import { useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PasswordInputWithEye from "../../components/ui/PasswordInputWithEye";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const { token } = useParams();
  const { resetPassword, loading } = useContext(AuthContext);

  const { password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "password") {
      setPasswordError("");
    }
    if (e.target.name === "confirmPassword") {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setConfirmPasswordError("");

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    await resetPassword(token, password);
  };

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
        Set New Password
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="form-label">
            New Password
          </label>
          <PasswordInputWithEye
            id="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={handleChange}
            className={passwordError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <PasswordInputWithEye
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={handleChange}
            className={confirmPasswordError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          />
          {confirmPasswordError && (
            <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? <LoadingSpinner /> : "Reset Password"}
          </button>
        </div>
      </form>
    </>
  );
};

export default ResetPassword;
