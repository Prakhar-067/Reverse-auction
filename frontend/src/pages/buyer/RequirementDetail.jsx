import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requirementsAPI, auctionsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, LoadingSpinner, formatCurrency, formatDate, formatDateTime, ConfirmDialog } from '../../components/common/UIComponents';
import { ArrowLeft, Send, Check, X, RotateCcw, Gavel } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    try {
      const { data } = await requirementsAPI.getById(id);
      if (data.success) setReq(data.data);
    } catch { toast.error('Failed to load requirement'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try { await requirementsAPI.submit(id); toast.success('Submitted for review'); fetchData(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try { await requirementsAPI.approve(id, { reason: 'Approved' }); toast.success('Requirement approved'); fetchData(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!reason) { toast.error('Reason is required'); return; }
    setActionLoading(true);
    try { await requirementsAPI.reject(id, { reason }); toast.success('Requirement rejected'); setShowReject(false); setReason(''); fetchData(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(false); }
  };

  const handleRevision = async () => {
    if (!reason) { toast.error('Reason is required'); return; }
    setActionLoading(true);
    try { await requirementsAPI.requestRevision(id, { reason }); toast.success('Revision requested'); setShowRevision(false); setReason(''); fetchData(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(false); }
  };

  const handleCreateAuction = async () => {
    setActionLoading(true);
    try {
      const { data } = await auctionsAPI.create({
        requirementId: id,
        title: req.title,
        description: req.description,
        startingPrice: req.estimatedBudget,
        minimumBidDecrement: req.minimumBidDecrement || 5000,
        startTime: req.auctionStartDate || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: req.auctionEndDate || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        visibility: req.isPublic ? 'PUBLIC' : 'PRIVATE',
      });
      if (data.success) {
        toast.success('Auction created!');
        navigate(`/buyer/auctions/${data.data._id}`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(false); }
  };

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;
  if (!req) return <div className="text-center py-20 text-gray-500">Requirement not found</div>;

  const isBuyer = user?.role === 'BUYER';
  const isProcurement = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{req.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={req.status} />
            <span className="text-sm text-gray-400">{formatDate(req.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {isBuyer && ['DRAFT', 'REVISION_REQUIRED'].includes(req.status) && (
          <button onClick={handleSubmit} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
            <Send className="w-4 h-4" /> Submit for Review
          </button>
        )}
        {isBuyer && req.status === 'APPROVED' && (
          <button onClick={handleCreateAuction} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            <Gavel className="w-4 h-4" /> Create Auction
          </button>
        )}
        {isProcurement && req.status === 'PENDING_REVIEW' && (
          <>
            <button onClick={handleApprove} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
              <Check className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">
              <X className="w-4 h-4" /> Reject
            </button>
            <button onClick={() => setShowRevision(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700">
              <RotateCcw className="w-4 h-4" /> Request Revision
            </button>
          </>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-3">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Buyer</span><span className="font-medium">{req.buyer?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{req.category?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{req.productType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-medium">{req.quantity} {req.unit}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Estimated Budget</span><span className="font-medium text-blue-600">{formatCurrency(req.estimatedBudget)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery Location</span><span className="font-medium text-right max-w-[200px]">{req.deliveryLocation}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery Deadline</span><span className="font-medium">{formatDate(req.deliveryDeadline)}</span></div>
          </div>
        </div>

        <div className="space-y-6">
          {req.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 border-b pb-3 mb-3">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{req.description}</p>
            </div>
          )}
          {req.specifications && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 border-b pb-3 mb-3">Specifications</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{req.specifications}</p>
            </div>
          )}
        </div>
      </div>

      {/* Review History */}
      {req.reviewHistory?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4">Review History</h3>
          <div className="space-y-3">
            {req.reviewHistory.map((r, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${r.action === 'APPROVE' ? 'bg-green-100 text-green-600' : r.action === 'REJECT' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  {r.action === 'APPROVE' ? <Check className="w-4 h-4" /> : r.action === 'REJECT' ? <X className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.action?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{r.reviewedBy?.name} • {formatDateTime(r.reviewedAt)}</p>
                  {r.reason && <p className="text-sm text-gray-600 mt-1">{r.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReject(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Requirement</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for rejection..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowReject(false); setReason(''); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRevision(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Request Revision</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="What needs revision..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowRevision(false); setReason(''); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={handleRevision} disabled={actionLoading} className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50">Request Revision</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
