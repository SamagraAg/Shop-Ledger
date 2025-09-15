import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { customerAPI, transactionAPI } from '../services/api';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [txnForm, setTxnForm] = useState({
    type: 'debt',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCustomer();
    if (location.search.includes('action=add-transaction')) {
      setShowTxnForm(true);
    }
  }, [id, location]);

  const fetchCustomer = async () => {
    setLoading(true);
    setError('');
    try {
      const [custResp, txnResp] = await Promise.all([
        customerAPI.getById(id),
        transactionAPI.getByCustomer(id)
      ]);
      
      if (custResp.data.success) {
        setCustomer(custResp.data.customer);
      } else {
        setError('Customer not found');
        return;
      }
      
      if (txnResp.data.success) {
        setTransactions(txnResp.data.txns);
        const bal = txnResp.data.txns.reduce((total, txn) => 
          txn.type === 'debt' ? total + txn.amount : total - txn.amount, 0
        );
        setBalance(bal);
      }
      else {
        setError('Transactions not found');
        return;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (bal) => {
    const absBal = Math.abs(bal);
    if (bal > 0) return { text: `₹${absBal.toFixed(2)}`, type: 'debt', label: 'Owes' };
    if (bal < 0) return { text: `₹${absBal.toFixed(2)}`, type: 'credit', label: 'Credit' };
    return { text: '₹0.00', type: 'neutral', label: 'Clear' };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTxnForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateTxnForm = () => {
    const errors = {};
    if (!txnForm.amount || Number(txnForm.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
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
        amount: Number(txnForm.amount)
      };
      
      const resp = await transactionAPI.create(payload);
      if (resp.data.success) {
        setSuccess('Transaction added successfully!');
        setTxnForm({
          type: 'debt',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setShowTxnForm(false);
        await fetchCustomer();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      setFormErrors({ general: 'Failed to add transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await customerAPI.delete(customer._id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
          <button onClick={() => navigate('/')} className="back-btn">
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
              onClick={() => setShowTxnForm(!showTxnForm)}
            >
              {showTxnForm ? 'Cancel' : '+ Add Transaction'}
            </button>
            <button className="action-btn danger" onClick={handleDeleteCustomer}>
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

      {/* Success Message */}
      {success && (
        <div className="success-notification">
          {success}
        </div>
      )}

      {/* Add Transaction Form */}
      {showTxnForm && (
        <div className="transaction-form-card">
          <h2>Add New Transaction</h2>
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
                  className={`form-input ${formErrors.amount ? 'error' : ''}`}
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
                onClick={() => {
                  setShowTxnForm(false);
                  setFormErrors({});
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
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
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <div className="empty-icon">📝</div>
            <h3>No transactions yet</h3>
            <p>Add the first transaction to start tracking this customer's account.</p>
            <button 
              className="add-first-btn"
              onClick={() => setShowTxnForm(true)}
            >
              + Add First Transaction
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map(txn => (
              <div key={txn._id} className={`transaction-item ${txn.type}`}>
                <div className="transaction-main">
                  <div className="transaction-type-badge">
                    <span className={`type-indicator ${txn.type}`}>
                      {txn.type === 'debt' ? '↗️' : '↙️'}
                    </span>
                    <span className="type-text">
                      {txn.type === 'debt' ? 'Debt' : 'Payment'}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    ₹{txn.amount.toFixed(2)}
                  </div>
                </div>
                <div className="transaction-details">
                  <span className="transaction-date">{formatDate(txn.date)}</span>
                  {txn.description && (
                    <span className="transaction-desc">{txn.description}</span>
                  )}
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
