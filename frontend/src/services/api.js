import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "/api"
      : "http://localhost:5000/api",
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
};

// Customer API
export const customerAPI = {
  getAll: () => api.get("/customers"),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customer) => api.post("/customers", customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Transaction API
export const transactionAPI = {
  getByCustomer: (customerId) =>
    api.get(`/transactions/customer/${customerId}`),
  create: (transaction) => api.post("/transactions", transaction),
};

export default api;
