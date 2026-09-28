export const StatusBadge = ({ status, className = '' }) => {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
    PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-300',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-300',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-300',
    REVISION_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-300',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    REJECTED: 'bg-red-50 text-red-700 border-red-300',
    PUBLISHED: 'bg-blue-50 text-blue-700 border-blue-300',
    OPEN: 'bg-green-50 text-green-700 border-green-300',
    CLOSED: 'bg-slate-100 text-slate-700 border-slate-300',
    CANCELLED: 'bg-red-50 text-red-600 border-red-300',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    WINNER_SELECTED: 'bg-purple-50 text-purple-700 border-purple-300',
    ORDER_CREATED: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    UNDER_EVALUATION: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    SUSPENDED: 'bg-yellow-50 text-yellow-700 border-yellow-300',
    VALID: 'bg-green-50 text-green-700 border-green-300',
    INVALID: 'bg-red-50 text-red-700 border-red-300',
    WINNING: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    OUTBID: 'bg-orange-50 text-orange-700 border-orange-300',
    WITHDRAWN: 'bg-gray-100 text-gray-600 border-gray-300',
    WITHDRAWAL_PENDING: 'bg-amber-50 text-amber-700 border-amber-300',
    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-300',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    FAILED: 'bg-red-50 text-red-700 border-red-300',
    REFUNDED: 'bg-purple-50 text-purple-700 border-purple-300',
    PAYMENT_PENDING: 'bg-amber-50 text-amber-700 border-amber-300',
    ACTIVE: 'bg-green-50 text-green-700 border-green-300',
    INACTIVE: 'bg-gray-100 text-gray-600 border-gray-300',
    ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-300',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    READY_FOR_DELIVERY: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    DELIVERED: 'bg-teal-50 text-teal-700 border-teal-300',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    CREATED: 'bg-blue-50 text-blue-700 border-blue-300',
    DISPUTED: 'bg-red-50 text-red-700 border-red-300',
  };

  const label = (status || '').replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'} ${className}`}>
      {label}
    </span>
  );
};

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin ${sizes[size]} border-4 border-blue-500 border-t-transparent rounded-full`} />
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && <Icon className="w-16 h-16 text-gray-300 mb-4" />}
    <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
    {description && <p className="text-gray-400 mb-4 max-w-md">{description}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <span className="text-red-500 text-2xl">!</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-600 mb-2">Something went wrong</h3>
    <p className="text-gray-400 mb-4">{message || 'An error occurred'}</p>
    {onRetry && <button onClick={onRetry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Try Again</button>}
  </div>
);

export const DashboardCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} p-6 transform transition-all`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) => {
  const variants = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-white rounded-lg transition-colors ${variants[variant]}`}>{confirmText}</button>
      </div>
    </Modal>
  );
};

export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
