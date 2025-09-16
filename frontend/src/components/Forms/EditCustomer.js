  import React, { useEffect, useState } from "react";
  import { customerAPI } from "../../services/api";
  import { useParams, useNavigate } from "react-router-dom";

  export default function EditCustomer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // const [customer, setCustomer] = useState(null);
    const [form, setForm] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
      setLoading(true);
      setError("");
      try {
        console.log(id);
        const custResp = await customerAPI.getById(id);
        if (custResp.data.success) {
          // setCustomer(custResp.data.customer);
          setForm(custResp.data.customer) 
        } else {
          setError("Customer not found");
          return;
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load customer data");
      } finally {
        setLoading(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name]) {
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };

    const validateForm = () => {
      const errors = {};

      if (!form.name.trim()) {
        errors.name = "Customer name is required";
      }

      if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
        errors.phone = "Please enter a valid 10-digit phone number";
      }

      return errors;
    };

    const handleEditCustomer = async (e) => {
      e.preventDefault();

      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await customerAPI.update(id,form);
        if (response.data.success) {
          //Navigate to customerdetail page
          navigate(`/customer/${id}`);
        }
      } catch (err) {
        console.error("Error editing customer:", err);
        setFormErrors({
          general: err.response?.data?.message || "Failed to edit customer",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    if (loading) {
      return (
        <div className="customer-detail-loading">
          <div className="spinner">Loading customer details...</div>
        </div>
      );
    }

    if (error && !form) {
      return (
        <div className="customer-detail-error">
          <div className="error-card">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/")} className="back-btn">
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (!form) return null;
    return (
      <div className="add-customer-form">
        <h3>Add New Customer</h3>
        <form onSubmit={handleEditCustomer}>
          {formErrors.general && (
            <div className="error-message general-error">
              {formErrors.general}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Customer Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className={formErrors.name ? "error" : ""}
                placeholder="Enter customer name"
                disabled={isSubmitting}
              />
              {formErrors.name && (
                <span className="error-message">{formErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className={formErrors.phone ? "error" : ""}
                placeholder="Enter phone number"
                disabled={isSubmitting}
              />
              {formErrors.phone && (
                <span className="error-message">{formErrors.phone}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleInputChange}
              placeholder="Enter address (optional)"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                navigate(`/customer/${id}`);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Editing..." : "Edit Customer"}
            </button>
          </div>
        </form>
      </div>
    );
  }
