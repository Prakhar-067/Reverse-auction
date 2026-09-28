import { useState, useEffect } from 'react';
import { reportsAPI } from '../../api';
import { LoadingSpinner, formatCurrency } from '../../components/common/UIComponents';
import { BarChart3, TrendingUp, DollarSign, Gavel, FileSpreadsheet, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('procurement');
  const [loading, setLoading] = useState(true);
  const [procurementData, setProcurementData] = useState(null);
  const [auctionData, setAuctionData] = useState(null);
  const [bidData, setBidData] = useState(null);
  const [financeData, setFinanceData] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        if (activeTab === 'procurement') {
          const { data } = await reportsAPI.getProcurement();
          if (data.success) setProcurementData(data.data);
        } else if (activeTab === 'auctions') {
          const { data } = await reportsAPI.getAuctions();
          if (data.success) setAuctionData(data.data);
        } else if (activeTab === 'bids') {
          const { data } = await reportsAPI.getBids();
          if (data.success) setBidData(data.data);
        } else if (activeTab === 'finance') {
          const { data } = await reportsAPI.getFinance();
          if (data.success) setFinanceData(data.data);
        }
      } catch (error) {
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Detailed system insights, procurement savings, and financial metrics</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        {[
          { id: 'procurement', label: 'Procurement Savings' },
          { id: 'auctions', label: 'Auction Reports' },
          { id: 'bids', label: 'Bid Analytics' },
          { id: 'finance', label: 'Financial Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" />
      ) : activeTab === 'procurement' && procurementData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 font-medium">Estimated Budget</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(procurementData.totalEstimatedBudget)}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 font-medium">Winning Bids Total</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(procurementData.totalWinningValue)}</h3>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/20">
              <p className="text-xs text-green-100 font-medium">Total Cost Savings</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(procurementData.potentialSavings)}</h3>
              <p className="text-xs text-green-100 mt-1">{procurementData.savingsPercent}% average savings</p>
            </div>
          </div>

          {procurementData.savingsData?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Completed Auction Savings Detail</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Auction Title</th>
                      <th className="py-3 px-4">Estimated Budget</th>
                      <th className="py-3 px-4">Winning Bid</th>
                      <th className="py-3 px-4">Savings Amount</th>
                      <th className="py-3 px-4">Savings %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {procurementData.savingsData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-medium text-gray-800">{item.title}</td>
                        <td className="py-3 px-4 text-gray-600">{formatCurrency(item.estimated)}</td>
                        <td className="py-3 px-4 text-blue-600 font-medium">{formatCurrency(item.winning)}</td>
                        <td className="py-3 px-4 text-green-600 font-semibold">{formatCurrency(item.savings)}</td>
                        <td className="py-3 px-4 text-green-600 font-semibold">{item.savingsPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'auctions' && auctionData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Total Auctions</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{auctionData.total}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Open Auctions</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{auctionData.open}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Completed Auctions</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{auctionData.completed}</h3>
          </div>
        </div>
      ) : activeTab === 'bids' && bidData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Total Bids Submitted</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{bidData.totalBids}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Unique Vendors</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{bidData.vendorParticipation}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Avg Bids per Auction</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{bidData.avgBidsPerAuction}</h3>
          </div>
        </div>
      ) : activeTab === 'finance' && financeData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Pending Payments</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{financeData.pending}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Successful Payments</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{financeData.paid}</h3>
          </div>
        </div>
      ) : null}
    </div>
  );
}
