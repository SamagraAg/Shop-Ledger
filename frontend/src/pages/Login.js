import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Login = () => {
  const { isAuthenticated, loading, dispatch } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await authAPI.login(formData);

      if (response.data.success) {
        // Login successful
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            token: response.data.token,
            user: response.data.user,
          },
        });
      } else {
        setErrors({ general: "Login failed. Please try again." });
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle different error scenarios
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.status === 401) {
        setErrors({ general: "Invalid username or password" });
      } else {
        setErrors({ general: "Network error. Please check your connection." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Shop Ledger</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={errors.username ? "error" : ""}
              placeholder="Enter your username"
              disabled={isSubmitting}
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? "error" : ""}
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>Default credentials: admin / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
