import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { customerAPI, transactionAPI } from "../services/api";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Show forms
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Forms states
  const [txnForm, setTxnForm] = useState({
    type: "debt",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Errors and success
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCustomer();
    if (location.search.includes("action=add-transaction")) {
      setShowTxnForm(true);
    }
  }, [id, location]);

  const fetchCustomer = async () => {
    setLoading(true);
    setError("");
    try {
      const [custResp, txnResp] = await Promise.all([
        customerAPI.getById(id),
        transactionAPI.getByCustomer(id),
      ]);

      if (custResp.data.success) {
        setCustomer(custResp.data.customer);
        setEditCustomerForm({
          name: custResp.data.customer.name || "",
          phone: custResp.data.customer.phone || "",
          address: custResp.data.customer.address || "",
        });
      } else {
        setError("Customer not found");
        return;
      }

      if (txnResp.data.success) {
        setTransactions(txnResp.data.txns);
        const bal = txnResp.data.txns.reduce(
          (total, txn) =>
            txn.type === "debt" ? total + txn.amount : total - txn.amount,
          0
        );
        setBalance(bal);
      } else {
        setError("Transactions not found");
        return;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (bal) => {
    const absBal = Math.abs(bal);
    if (bal > 0)
      return { text: `₹${absBal.toFixed(2)}`, type: "debt", label: "Owes" };
    if (bal < 0)
      return { text: `₹${absBal.toFixed(2)}`, type: "credit", label: "Credit" };
    return { text: "₹0.00", type: "neutral", label: "Clear" };
  };

  // Transaction form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTxnForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateTxnForm = () => {
    const errors = {};
    if (!txnForm.amount || Number(txnForm.amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    }
    return errors;
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    const errors = validateTxnForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...txnForm,
        customerId: customer._id,
        amount: Number(txnForm.amount),
      };

      if (editingTransaction) {
        // Update transaction
        const resp = await transactionAPI.update(
          editingTransaction._id,
          payload
        );
        if (resp.data.success) {
          setSuccess("Transaction updated successfully!");
          setEditingTransaction(null);
        }
      } else {
        // Add new transaction
        const resp = await transactionAPI.create(payload);
        if (resp.data.success) {
          setSuccess("Transaction added successfully!");
        }
      }

      setTxnForm({
        type: "debt",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowTxnForm(false);
      await fetchCustomer();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error processing transaction:", err);
      setFormErrors({ general: "Failed to process transaction" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit customer handlers
  const handleEditCustomerInput = (e) => {
    const { name, value } = e.target;
    setEditCustomerForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateCustomerForm = () => {
    const errors = {};
    if (!editCustomerForm.name.trim()) {
      errors.name = "Name is required";
    }
    return errors;
  };

  const handleCustomerUpdate = async (e) => {
    e.preventDefault();
    const errors = validateCustomerForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await customerAPI.update(customer._id, editCustomerForm);
      if (resp.data.success) {
        setCustomer(resp.data.customer);
        setSuccess("Customer info updated successfully!");
        setShowEditCustomer(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update customer info");
      }
    } catch (err) {
      setError("Error updating customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${customer.name}? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await customerAPI.delete(customer._id);
      navigate("/");
    } catch (err) {
      setError("Failed to delete customer");
    }
  };

  // Transaction edit/delete handlers
  const handleEditTransaction = (txn) => {
    setEditingTransaction(txn);
    setTxnForm({
      type: txn.type,
      amount: txn.amount.toString(),
      description: txn.description || "",
      date: txn.date
        ? new Date(txn.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setShowTxnForm(true);
    setFormErrors({});
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    try {
      const resp = await transactionAPI.delete(txnId);
      if (resp.data.success) {
        setSuccess("Transaction deleted successfully!");
        await fetchCustomer();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Error deleting transaction");
    }
  };

  const resetForms = () => {
    setShowTxnForm(false);
    setShowEditCustomer(false);
    setEditingTransaction(null);
    setFormErrors({});
    setTxnForm({
      type: "debt",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="customer-detail-loading">
        <div className="spinner">Loading customer details...</div>
      </div>
    );
  }

  if (error && !customer) {
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

  if (!customer) return null;

  const bal = formatBalance(balance);

  return (
    <div className="customer-detail">
      {/* Success Message */}
      {success && <div className="success-notification">{success}</div>}

      {/* Header Section */}
      <div className="customer-detail-header">
        <div className="customer-info-card">
          <div className="customer-primary-info">
            <h1 className="customer-name">{customer.name}</h1>
            <div className="customer-meta">
              {customer.phone && (
                <span className="meta-item">
                  <span className="meta-icon">📞</span>
                  {customer.phone}
                </span>
              )}
              {customer.address && (
                <span className="meta-item">
                  <span className="meta-icon">📍</span>
                  {customer.address}
                </span>
              )}
            </div>
          </div>
          <div className="customer-actions">
            <button
              className="action-btn primary"
              onClick={() => {
                if (showTxnForm) {
                  resetForms();
                } else {
                  setShowTxnForm(true);
                  setEditingTransaction(null);
                }
              }}
            >
              {showTxnForm ? "Cancel" : "+ Add Transaction"}
            </button>
            <button
              className="action-btn secondary"
              onClick={() => {
                setShowEditCustomer(true);
                setFormErrors({});
                setError("");
                setSuccess("");
              }}
            >
              ✏️ Edit Customer
            </button>
            <button
              className="action-btn danger"
              onClick={handleDeleteCustomer}
            >
              Delete Customer
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`balance-card ${bal.type}`}>
          <div className="balance-content">
            <span className="balance-label">{bal.label}</span>
            <span className="balance-amount">{bal.text}</span>
          </div>
        </div>
      </div>

      {/* Edit Customer Form */}
      {showEditCustomer && (
        <div className="edit-customer-card">
          <h2>Edit Customer Details</h2>
          <form onSubmit={handleCustomerUpdate} className="edit-customer-form">
            {formErrors.general && (
              <div className="error-message general-error">
                {formErrors.general}
              </div>
            )}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="edit-name">Name *</label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editCustomerForm.name}
                  onChange={handleEditCustomerInput}
                  className={`form-input ${formErrors.name ? "error" : ""}`}
                  disabled={isSubmitting}
                  required
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="edit-phone">Phone</label>
                <input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  value={editCustomerForm.phone}
                  onChange={handleEditCustomerInput}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="edit-address">Address</label>
              <input
                id="edit-address"
                name="address"
                type="text"
                value={editCustomerForm.address}
                onChange={handleEditCustomerInput}
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowEditCustomer(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Transaction Form */}
      {showTxnForm && (
        <div className="transaction-form-card">
          <h2>
            {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
          </h2>
          <form onSubmit={handleTxnSubmit} className="transaction-form">
            {formErrors.general && (
              <div className="error-message general-error">
                {formErrors.general}
              </div>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="type">Transaction Type</label>
                <select
                  id="type"
                  name="type"
                  value={txnForm.type}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  <option value="debt">Debt</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={txnForm.amount}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.amount ? "error" : ""}`}
                  placeholder="Enter amount"
                  min="1"
                  step="1"
                  disabled={isSubmitting}
                />
                {formErrors.amount && (
                  <span className="error-message">{formErrors.amount}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={txnForm.description}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Optional description"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={txnForm.date}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForms}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? editingTransaction
                    ? "Saving..."
                    : "Adding..."
                  : editingTransaction
                  ? "Save Changes"
                  : "Add Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction History */}
      <div className="transaction-history-card">
        <div className="history-header">
          <h2>Transaction History</h2>
          <span className="transaction-count">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <div className="empty-icon">📝</div>
            <h3>No transactions yet</h3>
            <p>
              Add the first transaction to start tracking this customer's
              account.
            </p>
            <button
              className="add-first-btn"
              onClick={() => {
                setShowTxnForm(true);
                setEditingTransaction(null);
              }}
            >
              + Add First Transaction
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((txn) => (
              <div key={txn._id} className={`transaction-item ${txn.type}`}>
                <div className="transaction-main">
                  <div className="transaction-type-badge">
                    <span className={`type-indicator ${txn.type}`}>
                      {txn.type === "debt" ? "↗️" : "↙️"}
                    </span>
                    <span className="type-text">
                      {txn.type === "debt" ? "Debt" : "Payment"}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    ₹{txn.amount.toFixed(2)}
                  </div>
                </div>
                <div className="transaction-details">
                  <span className="transaction-date">
                    {formatDate(txn.date)}
                  </span>
                  {txn.description && (
                    <span className="transaction-desc">{txn.description}</span>
                  )}
                </div>
                <div className="transaction-actions">
                  <button
                    className="edit-txn-btn"
                    onClick={() => handleEditTransaction(txn)}
                    title="Edit transaction"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="delete-txn-btn"
                    onClick={() => handleDeleteTransaction(txn._id)}
                    title="Delete transaction"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
