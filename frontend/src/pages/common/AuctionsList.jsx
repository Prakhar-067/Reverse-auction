import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auctionsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, LoadingSpinner, EmptyState, formatCurrency, formatDateTime } from '../../components/common/UIComponents';
import { Gavel, Search, Clock } from 'lucide-react';

export default function AuctionsList({ myAuctions = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const basePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'BUYER' ? '/buyer' : user?.role === 'VENDOR' ? '/vendor' : user?.role === 'PROCUREMENT_OFFICER' ? '/procurement' : '/auditor';

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (myAuctions) params.myAuctions = 'true';
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await auctionsAPI.getAll(params);
      if (data.success) { setAuctions(data.data); setPagination(data.pagination); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{myAuctions ? 'My Auctions' : 'Auctions'}</h1>
        <p className="text-gray-500 mt-1">{myAuctions ? 'Auctions you created' : 'Browse available auctions'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search auctions..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
          <option value="">All Statuses</option>
          {['DRAFT','PUBLISHED','OPEN','CLOSED','WINNER_SELECTED','COMPLETED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="min-h-[300px]" /> : auctions.length === 0 ? (
        <EmptyState icon={Gavel} title="No auctions found" description="No auctions match your criteria" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map(a => (
            <Link key={a._id} to={`${basePath}/auctions/${a._id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={a.status} />
                {a.status === 'OPEN' && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live</span>}
              </div>
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors mb-2 line-clamp-2">{a.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Starting Price</span>
                  <span className="font-medium">{formatCurrency(a.startingPrice)}</span>
                </div>
                {a.currentLowestBid && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lowest Bid</span>
                    <span className="font-bold text-green-600">{formatCurrency(a.currentLowestBid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Ends: {formatDateTime(a.endTime)}</span>
                  <span>{a.totalBids || 0} bids</span>
                </div>
              </div>
              {a.status === 'OPEN' && user?.role === 'VENDOR' && (
                <button className="w-full mt-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Place Bid →
                </button>
              )}
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)} className="px-4 py-2 text-sm border rounded-xl disabled:opacity-50 hover:bg-gray-50">Previous</button>
          <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => fetchData(pagination.page + 1)} className="px-4 py-2 text-sm border rounded-xl disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
