import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Gavel, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, verifyOtp, resendOtp, verifyMfa, authStep } = useAuth();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [otp, setOtp] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [devHints, setDevHints] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credentials = {};
      if (form.username) credentials.username = form.username;
      if (form.email) credentials.email = form.email;
      credentials.password = form.password;

      const result = await login(credentials);
      if (result.requiresOtp) {
        setDevHints({ otp: result.devOtp });
      } else if (result.requiresMfa) {
        setDevHints({ mfa: result.devMfaCode });
      } else if (result.success) {
        const paths = {
          ADMIN: '/admin/dashboard', BUYER: '/buyer/dashboard',
          PROCUREMENT_OFFICER: '/procurement/dashboard', VENDOR: '/vendor/dashboard',
          FINANCE_OFFICER: '/finance/dashboard',
          AUCTION_AUDITOR: '/auditor/dashboard',
        };
        navigate(paths[result.user.role] || '/');
      }
    } catch {} finally { setLoading(false); }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyOtp(otp);
      if (result.success) {
        const paths = {
          ADMIN: '/admin/dashboard', BUYER: '/buyer/dashboard',
          PROCUREMENT_OFFICER: '/procurement/dashboard', VENDOR: '/vendor/dashboard',
          FINANCE_OFFICER: '/finance/dashboard',
          AUCTION_AUDITOR: '/auditor/dashboard',
        };
        navigate(paths[result.user.role] || '/');
      }
    } catch {} finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const res = await resendOtp();
      if (res?.devOtp) setDevHints({ otp: res.devOtp });
    } catch {} finally { setResending(false); }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyMfa(mfaCode);
      if (result.success) {
        const paths = {
          ADMIN: '/admin/dashboard', BUYER: '/buyer/dashboard',
          PROCUREMENT_OFFICER: '/procurement/dashboard', VENDOR: '/vendor/dashboard',
          FINANCE_OFFICER: '/finance/dashboard',
          AUCTION_AUDITOR: '/auditor/dashboard',
        };
        navigate(paths[result.user.role] || '/');
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center">
              <Gavel className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reverse Auction</h1>
              <p className="text-blue-200">Management System</p>
            </div>
          </div>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            A centralized digital procurement platform where buyers create requirements and eligible vendors compete by submitting progressively lower bids.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '100%', label: 'Digital Process' },
              { num: '8+', label: 'User Roles' },
              { num: 'Real-time', label: 'Live Bidding' },
              { num: 'Full', label: 'Audit Trail' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{item.num}</p>
                <p className="text-blue-200 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Reverse Auction</h1>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>

            {authStep === 'otp_pending' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>
                <p className="text-gray-500 mb-4 text-sm">
                  We've sent a 6-digit verification code to your email address via Brevo API. Please check your inbox.
                </p>
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-3xl tracking-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={6} required />
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25">
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button type="button" onClick={handleResendOtp} disabled={resending}
                    className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50">
                    {resending ? 'Sending new code...' : 'Didn\'t receive code? Resend OTP'}
                  </button>
                </div>
              </>
            ) : authStep === 'mfa_pending' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">MFA Verification</h2>
                <p className="text-gray-500 mb-6 text-sm">Enter your MFA verification code sent to your email.</p>
                <form onSubmit={handleMfaVerify}>
                  <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="Enter MFA code"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" maxLength={6} />
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Verify MFA'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h2>
                <p className="text-gray-500 mb-6">Sign in to your account</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
                    <input type="text" value={form.email || form.username}
                      onChange={e => {
                        const v = e.target.value;
                        if (v.includes('@')) setForm({...form, email: v, username: ''});
                        else setForm({...form, username: v, email: ''});
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter email or username" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                        placeholder="Enter password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                  Don't have an account? <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
