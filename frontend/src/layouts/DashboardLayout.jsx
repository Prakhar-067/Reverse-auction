import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard, FileText, Gavel, ShoppingCart, Users, Settings, LogOut,
  Bell, Menu, X, ChevronDown, Shield, CreditCard, ClipboardList, BarChart3,
  Package, Truck, Eye, UserCircle, ScrollText, Boxes
} from 'lucide-react';

const roleNavItems = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Categories', path: '/admin/categories', icon: Boxes },
    { label: 'All Auctions', path: '/admin/auctions', icon: Gavel },
    { label: 'All Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
  ],
  BUYER: [
    { label: 'Dashboard', path: '/buyer/dashboard', icon: LayoutDashboard },
    { label: 'Requirements', path: '/buyer/requirements', icon: FileText },
    { label: 'My Auctions', path: '/buyer/auctions', icon: Gavel },
    { label: 'Orders', path: '/buyer/orders', icon: ShoppingCart },
    { label: 'Reports', path: '/buyer/reports', icon: BarChart3 },
  ],
  PROCUREMENT_OFFICER: [
    { label: 'Dashboard', path: '/procurement/dashboard', icon: LayoutDashboard },
    { label: 'Review Queue', path: '/procurement/reviews', icon: ClipboardList },
    { label: 'Auctions', path: '/procurement/auctions', icon: Gavel },
    { label: 'Reports', path: '/procurement/reports', icon: BarChart3 },
  ],
  VENDOR: [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
    { label: 'Available Auctions', path: '/vendor/auctions', icon: Gavel },
    { label: 'My Bids', path: '/vendor/bids', icon: FileText },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingCart },
  ],

  FINANCE_OFFICER: [
    { label: 'Dashboard', path: '/finance/dashboard', icon: LayoutDashboard },
    { label: 'Payments', path: '/finance/payments', icon: CreditCard },
    { label: 'Reports', path: '/finance/reports', icon: BarChart3 },
  ],
  AUCTION_AUDITOR: [
    { label: 'Dashboard', path: '/auditor/dashboard', icon: LayoutDashboard },
    { label: 'Auctions', path: '/auditor/auctions', icon: Gavel },
    { label: 'Audit Logs', path: '/auditor/audit-logs', icon: ScrollText },
    { label: 'Reports', path: '/auditor/reports', icon: BarChart3 },
  ],
};

const roleBadgeColors = {
  ADMIN: 'bg-red-100 text-red-700',
  BUYER: 'bg-blue-100 text-blue-700',
  PROCUREMENT_OFFICER: 'bg-purple-100 text-purple-700',
  VENDOR: 'bg-green-100 text-green-700',

  FINANCE_OFFICER: 'bg-amber-100 text-amber-700',
  AUCTION_AUDITOR: 'bg-indigo-100 text-indigo-700',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = roleNavItems[user?.role] || [];

  useEffect(() => {
    const fetchNotifCount = async () => {
      try {
        const { data } = await notificationsAPI.getAll({ limit: 1 });
        if (data.success) setNotifCount(data.data.unreadCount || 0);
      } catch {}
    };
    if (user) fetchNotifCount();
  }, [user, location]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotif = () => setNotifCount(c => c + 1);
    socket.on('notification:new', handleNewNotif);
    return () => socket.off('notification:new', handleNewNotif);
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const roleLabel = (user.role || '').replace(/_/g, ' ');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-gray-800 text-sm leading-tight">Reverse Auction</h1>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group
                  ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-3 mb-4 px-3 py-2 text-gray-400 hover:text-gray-600 text-xs flex items-center gap-2 rounded-lg hover:bg-gray-50 transition-colors">
          {sidebarOpen ? '← Collapse' : '→'}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl">
            <div className="flex items-center justify-between px-5 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-800 text-sm">Reverse Auction</h1>
                  <p className="text-xs text-gray-400">Management System</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <nav className="py-4 px-3">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all
                      ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-800">
                {navItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link to={`/${user.role === 'ADMIN' ? 'admin' : user.role === 'BUYER' ? 'buyer' : user.role === 'VENDOR' ? 'vendor' : user.role === 'PROCUREMENT_OFFICER' ? 'procurement' : user.role === 'FINANCE_OFFICER' ? 'finance' : 'auditor'}/notifications`}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{notifCount > 9 ? '9+' : notifCount}</span>
              )}
            </Link>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
