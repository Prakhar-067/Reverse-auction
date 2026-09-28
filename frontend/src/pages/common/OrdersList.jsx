import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, LoadingSpinner, EmptyState, formatCurrency, formatDate } from '../../components/common/UIComponents';
import { ShoppingCart, Search } from 'lucide-react';

export default function OrdersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const basePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'BUYER' ? '/buyer' : user?.role === 'VENDOR' ? '/vendor' : user?.role === 'PROCUREMENT_OFFICER' ? '/procurement' : '/auditor';

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await ordersAPI.getAll(params);
      if (data.success) { setOrders(data.data); setPagination(data.pagination); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);

  const statuses = ['CREATED', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-500 mt-1">Manage purchase orders and fulfillment</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="min-h-[300px]" /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders found" description="No orders match your criteria" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Order Ref / Auction</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Buyer & Supplier</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Fulfillment</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`${basePath}/orders/${o._id}`)}>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800 line-clamp-1">{o.auction?.title || 'Unknown Auction'}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{o._id.substring(18)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">B:</span> {o.buyer?.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5"><span className="font-medium text-gray-800">S:</span> {o.supplier?.name}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-800">{formatCurrency(o.amount)}</td>
                    <td className="py-3 px-4"><StatusBadge status={o.status} /></td>
                    <td className="py-3 px-4"><StatusBadge status={o.fulfillmentStatus} /></td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Prev</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => fetchData(pagination.page + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
