import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requirementsAPI, auctionsAPI } from '../../api';
import { DashboardCard, LoadingSpinner, StatusBadge, formatCurrency } from '../../components/common/UIComponents';
import { ClipboardList, Gavel, FileText, CheckCircle } from 'lucide-react';

export default function ProcurementDashboard() {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [reqRes, auctRes] = await Promise.all([
          requirementsAPI.getAll({ status: 'PENDING_REVIEW', limit: 5 }),
          auctionsAPI.getAll({ status: 'PUBLISHED', limit: 5 }),
        ]);
        if (reqRes.data.success) setRequirements(reqRes.data.data);
        if (auctRes.data.success) setAuctions(auctRes.data.data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Procurement Officer Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Reviews Pending" value={requirements.length} icon={ClipboardList} color="amber" />
        <DashboardCard title="Ready to Start" value={auctions.length} icon={Gavel} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Pending Reviews</h3>
            <Link to="/procurement/reviews" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {requirements.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No requirements pending review</p>
          ) : (
            <div className="space-y-3">
              {requirements.map(r => (
                <Link key={r._id} to={`/procurement/requirements/${r._id}`} className="block p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">{r.title}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-gray-500">Budget: {formatCurrency(r.estimatedBudget)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Auctions Ready to Start</h3>
            <Link to="/procurement/auctions" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {auctions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No auctions waiting to start</p>
          ) : (
            <div className="space-y-3">
              {auctions.map(a => (
                <Link key={a._id} to={`/procurement/auctions/${a._id}`} className="block p-4 rounded-xl border border-blue-100 bg-blue-50/30 hover:bg-blue-50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">{a.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-gray-500">Starting Price: {formatCurrency(a.startingPrice)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
