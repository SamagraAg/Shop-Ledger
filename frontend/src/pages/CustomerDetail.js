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
  const [txnForm, setTxnForm] = useState({
    type: 'debt',
    amount: '',
    description: '',
    date: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch customer data & transactions
  useEffect(() => {
    fetchCustomer();
    // Show "add transaction" if coming from dashboard quick link
    if (location.search.includes('action=add-transaction')) {
      document.getElementById('txn-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    setError('');
    try {
      const custResp = await customerAPI.getById(id);
      if (custResp.data.success) {
        setCustomer(custResp.data.customer);
      } else {
        setError('Customer not found');
      }
      const txnResp = await transactionAPI.getByCustomer(id);
      if (txnResp.data.success) {
        setTransactions(txnResp.data.txns);
        // Calculate balance
        const bal = txnResp.data.txns.reduce((total, txn) => 
          txn.type === 'debt' ? total + txn.amount : total - txn.amount, 0
        );
        setBalance(bal);
      }
    } catch (err) {
      setError('Failed to load customer data.');
    } finally {
      setLoading(false);
    }
  };

  // Format balance for UI
  const formatBalance = (bal) => {
    const absBal = Math.abs(bal);
    if (bal > 0) return { text: `₹${absBal.toFixed(2)}`, type: 'debt', label: 'Owes' };
    if (bal < 0) return { text: `₹${absBal.toFixed(2)}`, type: 'credit', label: 'Credit' };
    return { text: '₹0.00', type: 'neutral', label: 'Clear' };
  };

  // Handle transaction form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTxnForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate transaction form
  const validateTxnForm = () => {
    const errors = {};
    if (!txnForm.type) errors.type = 'Type required';
    if (!txnForm.amount || Number(txnForm.amount) <= 0)
      errors.amount = 'Amount must be positive';
    if (txnForm.date && isNaN(Date.parse(txnForm.date)))
      errors.date = 'Enter valid date';
    return errors;
  };

  // Add new transaction
  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
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
        date: txnForm.date || new Date().toISOString()
      };
      const resp = await transactionAPI.create(payload);
      if (resp.data.success) {
        setSuccess('Transaction added!');
        setTxnForm({ type: 'debt', amount: '', description: '', date: '' });
        // Refresh transactions
        fetchCustomer();
        setTimeout(() => setSuccess(''), 1600);
      } else {
        setError(resp.data.message || 'Failed to add transaction');
      }
    } catch (err) {
      setError('Error adding transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const resp = await customerAPI.delete(customer._id);
      if (resp.data.success) {
        navigate('/'); // Back to dashboard
      } else {
        setError('Failed to delete customer.');
      }
    } catch (err) {
      setError('Server error during delete.');
    }
  };

  if (loading) {
    return <div className="dashboard-loading"><span className="spinner">Loading...</span></div>;
  }
  if (error) {
    return <div className="error-message general-error">{error}</div>;
  }
  if (!customer) return null;

  const bal = formatBalance(balance);

  return (
    <div className="customer-detail">
      <div className="customer-header">
        <div>
          <h1>{customer.name}</h1>
          <div className="customer-meta">
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.address && <span>📍 {customer.address}</span>}
          </div>
        </div>
        <button className="delete-customer-btn" onClick={handleDeleteCustomer}>
          Delete Customer
        </button>
      </div>

      <div className={`balance-box ${bal.type}`}>
        <span className="balance-amount">{bal.text}</span>
        <span className="balance-label">{bal.label}</span>
      </div>

      {/* Transaction History */}
      <div className="txn-history">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="txn-empty">No transactions yet for this customer.</p>
        ) : (
          <table className="txn-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn._id}>
                  <td>{new Date(txn.date).toLocaleDateString()}</td>
                  <td className={txn.type}>{txn.type === 'debt' ? 'Debt' : 'Payment'}</td>
                  <td>{txn.amount}</td>
                  <td>{txn.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Transaction Form */}
      <div id="txn-form" className="add-txn-form">
        <h2>Add Transaction</h2>
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleTxnSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                name="type"
                value={txnForm.type}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="debt">Debt</option>
                <option value="payment">Payment</option>
              </select>
              {formErrors.type && <span className="error-message">{formErrors.type}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={txnForm.amount}
                onChange={handleInputChange}
                min="0"
                step="1"
                placeholder="Enter amount"
                required
                disabled={isSubmitting}
                className={formErrors.amount ? 'error' : ''}
              />
              {formErrors.amount && <span className="error-message">{formErrors.amount}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={txnForm.description}
                onChange={handleInputChange}
                placeholder="Optional details"
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
                disabled={isSubmitting}
              />
              {formErrors.date && <span className="error-message">{formErrors.date}</span>}
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerDetail;