import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, dispatch } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Link to="/">Shop Ledger</Link>
        </div>
        <nav className="nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/export" className="nav-link">Export</Link>
        </nav>
        <div className="user-menu">
          <span className="username">Welcome, {user?.username || 'Admin'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
