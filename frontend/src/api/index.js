import api from './client';

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  verifyMfa: (data) => api.post('/auth/verify-mfa', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateStatus: (id, data) => api.patch(`/users/${id}/status`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Requirements API
export const requirementsAPI = {
  getAll: (params) => api.get('/requirements', { params }),
  getById: (id) => api.get(`/requirements/${id}`),
  create: (data) => api.post('/requirements', data),
  update: (id, data) => api.patch(`/requirements/${id}`, data),
  submit: (id) => api.post(`/requirements/${id}/submit`),
  approve: (id, data) => api.post(`/requirements/${id}/approve`, data),
  reject: (id, data) => api.post(`/requirements/${id}/reject`, data),
  requestRevision: (id, data) => api.post(`/requirements/${id}/request-revision`, data),
};

// Auctions API
export const auctionsAPI = {
  getAll: (params) => api.get('/auctions', { params }),
  getById: (id) => api.get(`/auctions/${id}`),
  create: (data) => api.post('/auctions', data),
  update: (id, data) => api.patch(`/auctions/${id}`, data),
  publish: (id) => api.post(`/auctions/${id}/publish`),
  start: (id) => api.post(`/auctions/${id}/start`),
  close: (id) => api.post(`/auctions/${id}/close`),
  cancel: (id) => api.post(`/auctions/${id}/cancel`),
  getStats: (id) => api.get(`/auctions/${id}/stats`),
  selectWinner: (id) => api.post(`/auctions/${id}/select-winner`),
  getWinner: (id) => api.get(`/auctions/${id}/winner`),
};

// Bids API
export const bidsAPI = {
  getAuctionBids: (auctionId, params) => api.get(`/bids/auctions/${auctionId}/bids`, { params }),
  submitBid: (auctionId, data) => api.post(`/bids/auctions/${auctionId}/bids`, data),
  getMyBids: (params) => api.get('/bids/my', { params }),
  getById: (id) => api.get(`/bids/${id}`),
  withdrawRequest: (id, data) => api.post(`/bids/${id}/withdraw-request`, data),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.patch(`/orders/${id}`, data),
  approve: (id) => api.post(`/orders/${id}/approve`),
  complete: (id) => api.post(`/orders/${id}/complete`),
  updateFulfillment: (id, data) => api.post(`/orders/${id}/fulfillment`, data),
  withdrawalRequest: (id, data) => api.post(`/orders/${id}/withdrawal-request`, data),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  process: (id) => api.post(`/payments/${id}/process`),
  mockSuccess: (id) => api.post(`/payments/${id}/mock-success`),
  mockFailure: (id, data) => api.post(`/payments/${id}/mock-failure`, data),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// Audit API
export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getAuctions: (params) => api.get('/reports/auctions', { params }),
  getBids: () => api.get('/reports/bids'),
  getFinance: () => api.get('/reports/finance'),
  getProcurement: () => api.get('/reports/procurement'),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
};
