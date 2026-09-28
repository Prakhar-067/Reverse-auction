import { useState, useEffect } from 'react';
import { reportsAPI } from '../../api';
import { DashboardCard, LoadingSpinner, formatCurrency } from '../../components/common/UIComponents';
import { Users, Gavel, ShoppingCart, CreditCard, BarChart3, FileText, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportsAPI.getDashboard();
      if (res?.success) setData(res.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;
  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500 space-y-4">
        <p className="text-lg">Failed to load dashboard data</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { cards, charts } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Users" value={cards.totalUsers} icon={Users} color="blue" />
        <DashboardCard title="Active Auctions" value={cards.activeAuctions} icon={Gavel} color="green" />
        <DashboardCard title="Completed Auctions" value={cards.completedAuctions} icon={CheckCircle} color="purple" />
        <DashboardCard title="Total Orders" value={cards.totalOrders} icon={ShoppingCart} color="orange" />
        <DashboardCard title="Total Bids" value={cards.totalBids} icon={BarChart3} color="cyan" />
        <DashboardCard title="Pending Reviews" value={cards.pendingRequirements} icon={Clock} color="amber" />
        <DashboardCard title="Total Vendors" value={cards.totalVendors} icon={Users} color="indigo" />
        <DashboardCard title="Procurement Value" value={formatCurrency(cards.totalProcurementValue)} icon={CreditCard} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Auctions Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.auctionsOverTime?.map(d => ({ month: d._id, count: d.count })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bid Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.bidActivity?.map(d => ({ month: d._id, count: d.count })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.recentAuctions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Auctions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Buyer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Starting Price</th>
              </tr></thead>
              <tbody>
                {data.recentAuctions.map(a => (
                  <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{a.title}</td>
                    <td className="py-3 px-4 text-gray-600">{a.buyer?.name}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.status === 'OPEN' ? 'bg-green-100 text-green-700' : a.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{a.status}</span></td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(a.startingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
