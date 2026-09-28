import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportsAPI, auctionsAPI, requirementsAPI } from '../../api';
import { DashboardCard, LoadingSpinner, StatusBadge, formatCurrency } from '../../components/common/UIComponents';
import { FileText, Gavel, ShoppingCart, TrendingDown, Plus, Clock, CheckCircle } from 'lucide-react';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, auctRes, reqRes] = await Promise.all([
          reportsAPI.getDashboard(),
          auctionsAPI.getAll({ myAuctions: 'true', limit: 5 }),
          requirementsAPI.getAll({ limit: 5 }),
        ]);
        if (dashRes.data.success) setStats(dashRes.data.data.cards);
        if (auctRes.data.success) setAuctions(auctRes.data.data);
        if (reqRes.data.success) setRequirements(reqRes.data.data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
          <p className="text-gray-500 mt-1">Buyer Dashboard</p>
        </div>
        <Link to="/buyer/requirements/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Requirement
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Active Auctions" value={stats?.activeAuctions || 0} icon={Gavel} color="green" />
        <DashboardCard title="Pending Requirements" value={stats?.pendingRequirements || 0} icon={Clock} color="amber" />
        <DashboardCard title="Completed Auctions" value={stats?.completedAuctions || 0} icon={CheckCircle} color="purple" />
        <DashboardCard title="Procurement Value" value={formatCurrency(stats?.totalProcurementValue || 0)} icon={TrendingDown} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">My Requirements</h3>
            <Link to="/buyer/requirements" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {requirements.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No requirements yet</p>
          ) : (
            <div className="space-y-3">
              {requirements.map(r => (
                <Link key={r._id} to={`/buyer/requirements/${r._id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 text-sm">{r.title}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(r.estimatedBudget)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">My Auctions</h3>
            <Link to="/buyer/auctions" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {auctions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No auctions yet</p>
          ) : (
            <div className="space-y-3">
              {auctions.map(a => (
                <Link key={a._id} to={`/buyer/auctions/${a._id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 text-sm">{a.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">Starting: {formatCurrency(a.startingPrice)}</p>
                    <p className="text-xs font-medium text-green-600">Lowest: {formatCurrency(a.currentLowestBid)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
