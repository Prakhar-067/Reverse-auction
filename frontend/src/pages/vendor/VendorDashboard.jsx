import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auctionsAPI, bidsAPI } from '../../api';
import { DashboardCard, LoadingSpinner, StatusBadge, formatCurrency, formatDateTime } from '../../components/common/UIComponents';
import { Gavel, Award, TrendingUp, Search, Clock } from 'lucide-react';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [auctRes, bidsRes] = await Promise.all([
          auctionsAPI.getAll({ status: 'OPEN', limit: 5 }),
          bidsAPI.getMyBids({ limit: 5 }),
        ]);
        if (auctRes.data.success) setAuctions(auctRes.data.data);
        if (bidsRes.data.success) setMyBids(bidsRes.data.data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  const winningBids = myBids.filter(b => b.status === 'WINNING');
  const validBids = myBids.filter(b => b.status === 'VALID' || b.status === 'WINNING');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Vendor Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard title="Active Bids" value={validBids.length} icon={Gavel} color="blue" />
        <DashboardCard title="Winning Bids" value={winningBids.length} icon={Award} color="green" />
        <DashboardCard title="Available Auctions" value={auctions.length} icon={Search} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Available Live Auctions</h3>
            <Link to="/vendor/auctions" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {auctions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No live auctions right now</p>
          ) : (
            <div className="space-y-3">
              {auctions.map(a => (
                <Link key={a._id} to={`/vendor/auctions/${a._id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 line-clamp-1">{a.title}</p>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium whitespace-nowrap"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live</span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Starting Price</p>
                      <p className="text-sm font-medium">{formatCurrency(a.startingPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Lowest Bid</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(a.currentLowestBid)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">My Recent Bids</h3>
            <Link to="/vendor/bids" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {myBids.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No bids placed yet</p>
          ) : (
            <div className="space-y-3">
              {myBids.map(b => (
                <Link key={b._id} to={`/vendor/auctions/${b.auction?._id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">{b.auction?.title}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(b.amount)}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(b.submittedAt)}</p>
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
