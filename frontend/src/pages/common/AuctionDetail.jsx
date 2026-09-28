import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionsAPI, bidsAPI, ordersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, LoadingSpinner, formatCurrency, formatDateTime } from '../../components/common/UIComponents';
import { ArrowLeft, Clock, TrendingDown, Users, Award, Gavel, Play, Square, Trophy, ShoppingCart, Send as SendIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [stats, setStats] = useState(null);
  const timerRef = useRef(null);

  const basePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'BUYER' ? '/buyer' : user?.role === 'VENDOR' ? '/vendor' : user?.role === 'PROCUREMENT_OFFICER' ? '/procurement' : '/auditor';

  const fetchAuction = useCallback(async () => {
    try {
      const [aRes, bRes, sRes] = await Promise.all([
        auctionsAPI.getById(id),
        bidsAPI.getAuctionBids(id, { limit: 50 }),
        auctionsAPI.getStats(id).catch(() => null),
      ]);
      if (aRes.data.success) setAuction(aRes.data.data);
      if (bRes.data.success) setBids(bRes.data.data);
      if (sRes?.data?.success) setStats(sRes.data.data);
    } catch (err) { toast.error('Failed to load auction'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAuction(); }, [fetchAuction]);

  // Timer
  useEffect(() => {
    if (!auction?.endTime) return;
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(auction.endTime);
      const diff = end - now;
      if (diff <= 0) {
        setTimeRemaining('ENDED');
        clearInterval(timerRef.current);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(timerRef.current);
  }, [auction?.endTime]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('auction:join', id);

    socket.on('bid:accepted', (data) => {
      if (data.auctionId === id) {
        setAuction(prev => prev ? { ...prev, currentLowestBid: data.currentLowestBid, totalBids: data.totalBids } : prev);
        fetchAuction(); // Re-fetch bids
        toast.success('New bid submitted!', { icon: '📉' });
      }
    });

    socket.on('auction:closed', (data) => {
      if (data.auctionId === id) {
        setAuction(prev => prev ? { ...prev, status: 'CLOSED' } : prev);
        toast('Auction has been closed', { icon: '🔒' });
      }
    });

    socket.on('auction:started', (data) => {
      if (data.auctionId === id) {
        setAuction(prev => prev ? { ...prev, status: 'OPEN' } : prev);
        toast.success('Auction has started!', { icon: '🎉' });
      }
    });

    socket.on('auction:winnerSelected', (data) => {
      if (data.auctionId === id) {
        fetchAuction();
        toast.success('Winner has been selected!', { icon: '🏆' });
      }
    });

    socket.on('auction:endingSoon', (data) => {
      if (data.auctionId === id) {
        toast('⏰ Auction ending soon!', { duration: 5000 });
      }
    });

    return () => {
      socket.emit('auction:leave', id);
      socket.off('bid:accepted');
      socket.off('auction:closed');
      socket.off('auction:started');
      socket.off('auction:winnerSelected');
      socket.off('auction:endingSoon');
    };
  }, [socket, id, fetchAuction]);

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid bid amount'); return; }
    setBidLoading(true);
    try {
      await bidsAPI.submitBid(id, { amount });
      toast.success('Bid submitted successfully!');
      setBidAmount('');
      fetchAuction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bid');
    } finally { setBidLoading(false); }
  };

  const handlePublish = async () => { try { await auctionsAPI.publish(id); toast.success('Published'); fetchAuction(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };
  const handleStart = async () => { try { await auctionsAPI.start(id); toast.success('Started'); fetchAuction(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };
  const handleClose = async () => { try { await auctionsAPI.close(id); toast.success('Closed'); fetchAuction(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };
  const handleSelectWinner = async () => { try { await auctionsAPI.selectWinner(id); toast.success('Winner selected!'); fetchAuction(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };
  const handleCreateOrder = async () => {
    try { 
      const { data } = await ordersAPI.create({ auctionId: id }); 
      toast.success('Order created!'); 
      navigate(`${basePath}/orders/${data.data.order._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;
  if (!auction) return <div className="text-center py-20 text-gray-500">Auction not found</div>;

  const isVendor = user?.role === 'VENDOR';
  const isBuyer = user?.role === 'BUYER';
  const isProcurement = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';
  const isOpen = auction.status === 'OPEN';
  const currentLowest = auction.currentLowestBid || auction.startingPrice;
  const myBids = bids.filter(b => b.isOwnBid || (b.vendor && (b.vendor._id === user?._id || b.vendor === user?._id)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{auction.title}</h1>
            {isOpen && <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />LIVE</span>}
          </div>
          <StatusBadge status={auction.status} className="mt-1" />
        </div>
      </div>

      {/* Timer & Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Time Remaining</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${timeRemaining === 'ENDED' ? 'text-red-500' : 'text-gray-800'}`}>{timeRemaining || '--:--:--'}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm p-4 text-center text-white">
          <TrendingDown className="w-6 h-6 mx-auto mb-2 opacity-80" />
          <p className="text-xs opacity-80">Current Lowest Bid</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(currentLowest)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <Gavel className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Total Bids</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{auction.totalBids || bids.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <Users className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Participants</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{auction.participants?.length || 0}</p>
        </div>
      </div>

      {/* Action buttons for admin/procurement/buyer */}
      {(isProcurement || isBuyer) && (
        <div className="flex flex-wrap gap-3">
          {isProcurement && ['DRAFT', 'APPROVED'].includes(auction.status) && (
            <button onClick={handlePublish} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><SendIcon className="w-4 h-4" /> Publish</button>
          )}
          {isProcurement && auction.status === 'PUBLISHED' && (
            <button onClick={handleStart} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"><Play className="w-4 h-4" /> Start Auction</button>
          )}
          {(isProcurement || isBuyer) && auction.status === 'OPEN' && (
            <button onClick={handleClose} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"><Square className="w-4 h-4" /> Close Auction</button>
          )}
          {(isProcurement || isBuyer) && auction.status === 'CLOSED' && (
            <button onClick={handleSelectWinner} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"><Trophy className="w-4 h-4" /> Select Winner</button>
          )}
          {(isBuyer || isProcurement) && auction.status === 'WINNER_SELECTED' && (
            <button onClick={handleCreateOrder} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"><ShoppingCart className="w-4 h-4" /> Create Order</button>
          )}
        </div>
      )}

      {/* Winner display */}
      {auction.winner?.vendor && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">🎉 Winner Selected</h3>
              <p className="text-sm text-gray-600">{auction.winner.vendor.name || 'Selected Vendor'} — Winning bid: <span className="font-bold text-emerald-600">{formatCurrency(auction.winner.amount)}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bid Form (Vendors only) */}
        {isVendor && isOpen && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Gavel className="w-5 h-5 text-blue-600" /> Submit Bid</h3>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Starting Price:</span><span className="font-medium">{formatCurrency(auction.startingPrice)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Current Lowest:</span><span className="font-bold text-green-600">{formatCurrency(currentLowest)}</span></div>
                {auction.minimumBidDecrement > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">Min Decrement:</span><span className="font-medium">{formatCurrency(auction.minimumBidDecrement)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-600">Max Valid Bid:</span><span className="font-bold text-blue-600">{formatCurrency(currentLowest - (auction.minimumBidDecrement || 1))}</span></div>
              </div>

              {myBids.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 mb-4 text-sm">
                  <p className="text-amber-700 font-medium">Your Latest Bid: {formatCurrency(myBids[0]?.amount)}</p>
                  <p className="text-xs text-amber-600">{myBids[0]?.status}</p>
                </div>
              )}

              <form onSubmit={handleSubmitBid}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Bid Amount (₹)</label>
                <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                  placeholder={`Max ${(currentLowest - (auction.minimumBidDecrement || 1)).toLocaleString()}`}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4" min="1" step="1" required />
                <button type="submit" disabled={bidLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25">
                  {bidLoading ? 'Submitting...' : '⚡ SUBMIT BINDING BID'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">Bids are binding and cannot be withdrawn without approval</p>
              </form>
            </div>
          </div>
        )}

        {/* Bid History & Details */}
        <div className={`${isVendor && isOpen ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {/* Auction Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4">Auction Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Starting Price:</span><span className="ml-2 font-medium">{formatCurrency(auction.startingPrice)}</span></div>
              <div><span className="text-gray-500">Category:</span><span className="ml-2 font-medium">{auction.category?.name}</span></div>
              <div><span className="text-gray-500">Start Time:</span><span className="ml-2 font-medium">{formatDateTime(auction.startTime)}</span></div>
              <div><span className="text-gray-500">End Time:</span><span className="ml-2 font-medium">{formatDateTime(auction.endTime)}</span></div>
              <div><span className="text-gray-500">Buyer:</span><span className="ml-2 font-medium">{auction.buyer?.name}</span></div>
              <div><span className="text-gray-500">Visibility:</span><span className="ml-2 font-medium">{auction.visibility}</span></div>
            </div>
            {auction.description && <p className="mt-4 text-sm text-gray-600">{auction.description}</p>}
            {auction.eligibilityRequirements && <p className="mt-2 text-sm text-gray-500"><strong>Eligibility:</strong> {auction.eligibilityRequirements}</p>}
          </div>

          {/* Savings */}
          {stats && stats.lowestBid && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="font-semibold text-emerald-800 mb-3">💰 Potential Savings</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-gray-500">Estimated Budget</p><p className="text-xl font-bold text-gray-800">{formatCurrency(auction.startingPrice)}</p></div>
                <div><p className="text-gray-500">Lowest Bid</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.lowestBid)}</p></div>
                <div><p className="text-gray-500">Potential Savings</p><p className="text-xl font-bold text-blue-600">{formatCurrency(stats.savings)} ({stats.savingsPercent}%)</p></div>
              </div>
            </div>
          )}

          {/* Bid History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4">Bid History ({bids.length})</h3>
            {bids.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No bids yet</p>
            ) : (
              <div className="space-y-2">
                {bids.map((bid, index) => (
                  <div key={bid._id} className={`flex items-center justify-between p-3 rounded-xl ${bid.isOwnBid ? 'bg-blue-50 border border-blue-200' : index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {index === 0 ? '1st' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {bid.isOwnBid ? '⭐ Your Bid' : bid.vendor?.name || bid.vendorName || `Vendor`}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(bid.submittedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(bid.amount)}</p>
                      <StatusBadge status={bid.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
