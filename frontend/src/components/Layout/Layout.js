import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "./Header";

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
