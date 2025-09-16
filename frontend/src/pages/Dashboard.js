import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { customerAPI, transactionAPI } from "../services/api";

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [customerBalances, setCustomerBalances] = useState({});

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerAPI.getAll();
      if (response.data.success) {
        setCustomers(response.data.customers);
        // Fetch balances for each customer
        await fetchCustomerBalances(response.data.customers);
      } else {
        setError("Failed to fetch customers");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBalances = async (customerList) => {
    const balances = {};

    // Fetch transactions for each customer to calculate balance
    for (const customer of customerList) {
      try {
        const txnResponse = await transactionAPI.getByCustomer(customer._id);
        if (txnResponse.data.success) {
          const transactions = txnResponse.data.txns;
          const balance = transactions.reduce((total, txn) => {
            return txn.type === "debt"
              ? total + txn.amount
              : total - txn.amount;
          }, 0);
          balances[customer._id] = balance;
        }
      } catch (err) {
        console.error(`Error fetching balance for ${customer.name}:`, err);
        balances[customer._id] = 0;
      }
    }

    setCustomerBalances(balances);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle new customer form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!newCustomer.name.trim()) {
      errors.name = "Customer name is required";
    }

    if (
      newCustomer.phone &&
      !/^\d{10}$/.test(newCustomer.phone.replace(/\D/g, ""))
    ) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    return errors;
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await customerAPI.create(newCustomer);
      if (response.data.success) {
        // Refresh customer list
        await fetchCustomers();
        // Reset form
        setNewCustomer({ name: "", phone: "", address: "" });
        setFormErrors({});
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Error adding customer:", err);
      setFormErrors({
        general: err.response?.data?.message || "Failed to add customer",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBalance = (balance) => {
    const absBalance = Math.abs(balance);
    if (balance > 0) {
      return { text: `₹${absBalance.toFixed(2)}`, type: "debt", label: "Owes" };
    } else if (balance < 0) {
      return {
        text: `₹${absBalance.toFixed(2)}`,
        type: "credit",
        label: "Credit",
      };
    } else {
      return { text: "₹0.00", type: "neutral", label: "Clear" };
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Customer Dashboard</h1>
          <p>Manage your customers and track their transactions</p>
        </div>
        <button
          className="add-customer-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add Customer"}
        </button>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <div className="add-customer-form">
          <h3>Add New Customer</h3>
          <form onSubmit={handleAddCustomer}>
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
                  value={newCustomer.name}
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
                  value={newCustomer.phone}
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
                value={newCustomer.address}
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
                  setShowAddForm(false);
                  setNewCustomer({ name: "", phone: "", address: "" });
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="customer-stats">
          <span className="stat">
            Total Customers: <strong>{customers.length}</strong>
          </span>
          <span className="stat">
            Showing: <strong>{filteredCustomers.length}</strong>
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message general-error">
          {error}
          <button onClick={fetchCustomers} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <h3>No customers found</h3>
          <p>
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by adding your first customer"}
          </p>
          {!searchTerm && !showAddForm && (
            <button
              className="add-customer-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add Your First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="customer-grid">
          {filteredCustomers.map((customer) => {
            const balance = formatBalance(customerBalances[customer._id] || 0);
            return (
              <div key={customer._id} className="customer-card">
                <div className="customer-info">
                  <h3 className="customer-name">{customer.name}</h3>
                  {customer.phone && (
                    <p className="customer-phone">📞 {customer.phone}</p>
                  )}
                  {customer.address && (
                    <p className="customer-address">📍 {customer.address}</p>
                  )}
                </div>

                <div className="customer-balance">
                  <span className={`balance-amount ${balance.type}`}>
                    {balance.text}
                  </span>
                  <span className="balance-label">{balance.label}</span>
                </div>

                <div className="customer-actions">
                  <Link
                    to={`/customer/${customer._id}`}
                    className="action-btn primary"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/customer/${customer._id}?action=add-transaction`}
                    className="action-btn secondary"
                  >
                    Add Transaction
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
