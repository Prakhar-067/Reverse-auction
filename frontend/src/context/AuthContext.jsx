import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const ROLE_PERMISSIONS = {
  ADMIN: ['USER_VIEW','USER_CREATE','USER_UPDATE','USER_DISABLE','ROLE_ASSIGN','REQUIREMENT_CREATE','REQUIREMENT_VIEW','REQUIREMENT_EDIT','REQUIREMENT_SUBMIT','REQUIREMENT_REVIEW','REQUIREMENT_APPROVE','REQUIREMENT_REJECT','AUCTION_CREATE','AUCTION_VIEW','AUCTION_EDIT','AUCTION_PUBLISH','AUCTION_START','AUCTION_CLOSE','AUCTION_CANCEL','AUCTION_MONITOR','BID_VIEW','BID_SUBMIT','BID_UPDATE','BID_WITHDRAW_REQUEST','BID_EVALUATE','WINNER_SELECT','ORDER_CREATE','ORDER_VIEW','ORDER_UPDATE','PAYMENT_VIEW','PAYMENT_PROCESS','PAYMENT_UPDATE','AUDIT_VIEW','AUDIT_EXPORT','REPORT_VIEW','REPORT_EXPORT','NOTIFICATION_VIEW','CATEGORY_MANAGE'],
  BUYER: ['REQUIREMENT_CREATE','REQUIREMENT_VIEW','REQUIREMENT_EDIT','REQUIREMENT_SUBMIT','AUCTION_CREATE','AUCTION_VIEW','AUCTION_EDIT','AUCTION_MONITOR','BID_VIEW','WINNER_SELECT','ORDER_CREATE','ORDER_VIEW','NOTIFICATION_VIEW','REPORT_VIEW'],
  PROCUREMENT_OFFICER: ['REQUIREMENT_VIEW','REQUIREMENT_REVIEW','REQUIREMENT_APPROVE','REQUIREMENT_REJECT','AUCTION_VIEW','AUCTION_PUBLISH','AUCTION_START','AUCTION_CLOSE','AUCTION_MONITOR','BID_VIEW','BID_EVALUATE','ORDER_VIEW','NOTIFICATION_VIEW','REPORT_VIEW'],
  VENDOR: ['AUCTION_VIEW','BID_VIEW','BID_SUBMIT','BID_UPDATE','BID_WITHDRAW_REQUEST','ORDER_VIEW','NOTIFICATION_VIEW'],

  FINANCE_OFFICER: ['ORDER_VIEW','PAYMENT_VIEW','PAYMENT_PROCESS','PAYMENT_UPDATE','REPORT_VIEW','NOTIFICATION_VIEW'],
  AUCTION_AUDITOR: ['AUCTION_VIEW','BID_VIEW','ORDER_VIEW','PAYMENT_VIEW','AUDIT_VIEW','AUDIT_EXPORT','REPORT_VIEW','REPORT_EXPORT'],
  GUEST: ['AUCTION_VIEW'],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState(null); // 'otp_pending', 'mfa_pending'
  const [tempToken, setTempToken] = useState(null);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      if (data.success) {
        setUser(data.data.user);
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      if (data.data?.requiresOtp) {
        setAuthStep('otp_pending');
        setTempToken(data.data.tempToken);
        return { requiresOtp: true, devOtp: data.data.devOtp };
      }
      if (data.data?.requiresMfa) {
        setAuthStep('mfa_pending');
        setTempToken(data.data.tempToken);
        return { requiresMfa: true, devMfaCode: data.data.devMfaCode };
      }
      // Direct login
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      setToken(data.data.token);
      toast.success('Login successful!');
      return { success: true, user: data.data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw error;
    }
  };

  const verifyOtp = async (otp) => {
    try {
      const { data } = await authAPI.verifyOtp({ tempToken, otp });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      setToken(data.data.token);
      setAuthStep(null);
      setTempToken(null);
      toast.success('OTP verified! Login successful.');
      return { success: true, user: data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
      throw error;
    }
  };

  const verifyMfa = async (mfaCode) => {
    try {
      const { data } = await authAPI.verifyMfa({ tempToken, mfaCode });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      setToken(data.data.token);
      setAuthStep(null);
      setTempToken(null);
      toast.success('MFA verified! Login successful.');
      return { success: true, user: data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'MFA verification failed');
      throw error;
    }
  };

  const resendOtp = async () => {
    try {
      const { data } = await authAPI.resendOtp({ tempToken });
      toast.success(data.message || 'OTP resent to your email!');
      return { success: true, devOtp: data.data?.devOtp };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await authAPI.register(userData);
      if (data.data?.requiresOtp) {
        setAuthStep('otp_pending');
        setTempToken(data.data.tempToken);
        toast.success('Registration successful! OTP sent to your email.');
        return { requiresOtp: true, devOtp: data.data.devOtp };
      }
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      setToken(data.data.token);
      toast.success('Registration successful!');
      return { success: true, user: data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setAuthStep(null);
    setTempToken(null);
    toast.success('Logged out');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...permissions) => {
    return permissions.some(p => hasPermission(p));
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const paths = {
      ADMIN: '/admin/dashboard',
      BUYER: '/buyer/dashboard',
      PROCUREMENT_OFFICER: '/procurement/dashboard',
      VENDOR: '/vendor/dashboard',

      FINANCE_OFFICER: '/finance/dashboard',
      AUCTION_AUDITOR: '/auditor/dashboard',
    };
    return paths[user.role] || '/';
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, authStep, login, logout, register,
      verifyOtp, resendOtp, verifyMfa, hasPermission, hasAnyPermission, getDashboardPath, loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
