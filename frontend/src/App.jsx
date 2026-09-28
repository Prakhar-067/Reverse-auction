import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts & Common
import DashboardLayout from './layouts/DashboardLayout';
import { LoadingSpinner } from './components/common/UIComponents';
import { RoleRoute } from './components/common/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import ReportsPage from './pages/admin/ReportsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import RequirementsList from './pages/buyer/RequirementsList';
import CreateRequirement from './pages/buyer/CreateRequirement';
import RequirementDetail from './pages/buyer/RequirementDetail';

// Procurement Pages
import ProcurementDashboard from './pages/procurement/ProcurementDashboard';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorBidsList from './pages/vendor/VendorBidsList';

// Common Pages
import AuctionsList from './pages/common/AuctionsList';
import AuctionDetail from './pages/common/AuctionDetail';
import OrdersList from './pages/common/OrdersList';
import OrderDetail from './pages/common/OrderDetail';
import NotificationsPage from './pages/common/NotificationsPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;
  
  const paths = {
    ADMIN: '/admin/dashboard',
    BUYER: '/buyer/dashboard',
    PROCUREMENT_OFFICER: '/procurement/dashboard',
    VENDOR: '/vendor/dashboard',
    FINANCE_OFFICER: '/finance/dashboard',
    AUCTION_AUDITOR: '/auditor/dashboard',
  };
  return <Navigate to={paths[user.role] || '/login'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public/Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Routes Wrapper */}
            <Route element={<DashboardLayout />}>
              
              {/* Admin Routes */}
              <Route path="/admin" element={<RoleRoute roles={['ADMIN']}><Outlet /></RoleRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="auctions" element={<AuctionsList />} />
                <Route path="auctions/:id" element={<AuctionDetail />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Buyer Routes */}
              <Route path="/buyer" element={<RoleRoute roles={['BUYER']}><Outlet /></RoleRoute>}>
                <Route path="dashboard" element={<BuyerDashboard />} />
                <Route path="requirements" element={<RequirementsList />} />
                <Route path="requirements/new" element={<CreateRequirement />} />
                <Route path="requirements/:id" element={<RequirementDetail />} />
                <Route path="auctions" element={<AuctionsList myAuctions />} />
                <Route path="auctions/:id" element={<AuctionDetail />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Procurement Routes */}
              <Route path="/procurement" element={<RoleRoute roles={['PROCUREMENT_OFFICER', 'ADMIN']}><Outlet /></RoleRoute>}>
                <Route path="dashboard" element={<ProcurementDashboard />} />
                <Route path="reviews" element={<RequirementsList />} />
                <Route path="requirements/:id" element={<RequirementDetail />} />
                <Route path="auctions" element={<AuctionsList />} />
                <Route path="auctions/:id" element={<AuctionDetail />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Vendor Routes */}
              <Route path="/vendor" element={<RoleRoute roles={['VENDOR']}><Outlet /></RoleRoute>}>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="auctions" element={<AuctionsList />} />
                <Route path="auctions/:id" element={<AuctionDetail />} />
                <Route path="bids" element={<VendorBidsList />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Finance Officer Routes */}
              <Route path="/finance" element={<RoleRoute roles={['FINANCE_OFFICER', 'ADMIN']}><Outlet /></RoleRoute>}>
                <Route path="dashboard" element={<ReportsPage />} />
                <Route path="payments" element={<OrdersList />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Auction Auditor Routes */}
              <Route path="/auditor" element={<RoleRoute roles={['AUCTION_AUDITOR', 'ADMIN']}><Outlet /></RoleRoute>}>
                <Route path="dashboard" element={<ReportsPage />} />
                <Route path="auctions" element={<AuctionsList />} />
                <Route path="auctions/:id" element={<AuctionDetail />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

            </Route>
            
            {/* 404 */}
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><h1 className="text-6xl font-bold text-gray-300">404</h1><p className="text-gray-500 mt-2">Page not found</p><a href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">Go Home</a></div></div>} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
