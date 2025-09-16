import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import Layout from "./components/Layout/Layout.js";
import Login from "./pages/Login.js";
import Dashboard from "./pages/Dashboard.js";
import CustomerDetail from "./pages/CustomerDetail.js";
import Export from "./pages/Export.js";
import "./index.css";
import EditCustomer from "./components/Forms/EditCustomer.js";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="customer/:id" element={<CustomerDetail />} />
              <Route path="export" element={<Export />} />
              <Route path="customer/:id/edit" element={<EditCustomer />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
