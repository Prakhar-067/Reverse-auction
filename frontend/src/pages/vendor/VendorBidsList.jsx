import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bidsAPI } from '../../api';
import { StatusBadge, LoadingSpinner, EmptyState, formatCurrency, formatDateTime } from '../../components/common/UIComponents';
import { Gavel, Clock, Search, ExternalLink, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendorBidsList() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [withdrawModal, setWithdrawModal] = useState({ open: false, bidId: null, reason: '' });
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const fetchBids = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await bidsAPI.getMyBids(params);
      if (data.success) {
        setBids(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids(1);
  }, [statusFilter]);

  const handleWithdrawRequest = async () => {
    if (!withdrawModal.reason.trim()) {
      toast.error('Please enter a reason for withdrawal');
      return;
    }
    setSubmittingWithdraw(true);
    try {
      const { data } = await bidsAPI.withdrawRequest(withdrawModal.bidId, { reason: withdrawModal.reason });
      if (data.success) {
        toast.success('Withdrawal request submitted successfully');
        setWithdrawModal({ open: false, bidId: null, reason: '' });
        fetchBids(pagination.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request bid withdrawal');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Bids</h1>
          <p className="text-gray-500 text-sm mt-1">Track all bids you have submitted across auctions</p>
        </div>
        <Link
          to="/vendor/auctions"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <Gavel className="w-4 h-4" /> Browse Auctions
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="WINNING">Winning</option>
            <option value="OUTBID">Outbid</option>
            <option value="VALID">Valid</option>
            <option value="WITHDRAWAL_PENDING">Withdrawal Pending</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
        <span className="text-xs text-gray-400">Total Bids Found: {pagination.total || bids.length}</span>
      </div>

      {/* Bids List Table */}
      {loading ? (
        <LoadingSpinner className="min-h-[300px]" />
      ) : bids.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No bids found"
          description="You haven't placed any bids matching this filter yet."
          actionText="Explore Live Auctions"
          actionPath="/vendor/auctions"
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Auction Details</th>
                  <th className="py-3.5 px-5">Submitted Amount</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Submitted At</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bids.map((bid) => (
                  <tr key={bid._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-800 line-clamp-1">
                        {bid.auction?.title || 'Auction'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>Auction Status: <strong className="text-gray-600">{bid.auction?.status}</strong></span>
                        {bid.auction?.currentLowestBid && (
                          <span>Lowest Bid: <strong className="text-green-600">{formatCurrency(bid.auction.currentLowestBid)}</strong></span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-base font-bold text-gray-900">{formatCurrency(bid.amount)}</span>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={bid.status} />
                    </td>
                    <td className="py-4 px-5 text-gray-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDateTime(bid.submittedAt)}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bid.auction?._id && (
                          <Link
                            to={`/vendor/auctions/${bid.auction._id}`}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            View Auction <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {['VALID', 'WINNING', 'OUTBID'].includes(bid.status) && (
                          <button
                            onClick={() => setWithdrawModal({ open: true, bidId: bid._id, reason: '' })}
                            className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 font-medium rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchBids(pagination.page - 1)}
                  className="px-3 py-1.5 text-xs font-medium border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchBids(pagination.page + 1)}
                  className="px-3 py-1.5 text-xs font-medium border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Withdrawal Request */}
      {withdrawModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Request Bid Withdrawal</h3>
                <p className="text-xs text-gray-500">Submit a request to withdraw your bid</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Withdrawal *</label>
              <textarea
                rows={3}
                value={withdrawModal.reason}
                onChange={(e) => setWithdrawModal({ ...withdrawModal, reason: e.target.value })}
                placeholder="Please state why you wish to withdraw this bid..."
                className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setWithdrawModal({ open: false, bidId: null, reason: '' })}
                className="px-4 py-2 text-sm text-gray-600 font-medium rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawRequest}
                disabled={submittingWithdraw}
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {submittingWithdraw ? 'Submitting...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
