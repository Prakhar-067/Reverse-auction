import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, LoadingSpinner, formatCurrency, formatDate, ConfirmDialog } from '../../components/common/UIComponents';
import { ArrowLeft, CheckCircle, Package, Truck, Box, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState('');

  const fetchData = async () => {
    try {
      const { data } = await ordersAPI.getById(id);
      if (data.success) setOrder(data.data);
    } catch { toast.error('Failed to load order'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try { await ordersAPI.approve(id); toast.success('Order approved'); fetchData(); } catch (err) { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try { await ordersAPI.complete(id); toast.success('Order completed'); fetchData(); } catch (err) { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const updateFulfillment = async (status) => {
    setActionLoading(true);
    try { 
      const payload = { fulfillmentStatus: status };
      if (status === 'SHIPPED' || status === 'READY_FOR_DELIVERY') {
        payload.trackingInfo = { carrier: 'Standard', trackingNumber: trackingInfo || 'TBD' };
      }
      await ordersAPI.updateFulfillment(id, payload); 
      toast.success('Fulfillment updated'); 
      fetchData(); 
    } catch (err) { toast.error('Failed to update status'); } finally { setActionLoading(false); }
  };

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const isProcurement = user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'ADMIN';
  const isBuyer = user?.role === 'BUYER';
  const isSupplier = user?.role === 'VENDOR';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">REF: {order._id}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.fulfillmentStatus} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isProcurement && order.status === 'CREATED' && (
          <button onClick={handleApprove} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"><Check className="w-4 h-4" /> Approve Order</button>
        )}
        {(isBuyer || isProcurement) && order.fulfillmentStatus === 'DELIVERED' && order.status !== 'COMPLETED' && (
          <button onClick={handleComplete} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Mark Completed</button>
        )}

        {/* Supplier Fulfillment Actions */}
        {isSupplier && order.status === 'APPROVED' && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-full">
            <span className="text-sm font-semibold text-gray-700 mr-2">Update Status:</span>
            {order.fulfillmentStatus === 'ASSIGNED' && (
              <button onClick={() => updateFulfillment('ACCEPTED')} disabled={actionLoading} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 font-medium disabled:opacity-50"><Check className="w-4 h-4" /> Accept Order</button>
            )}
            {order.fulfillmentStatus === 'ACCEPTED' && (
              <button onClick={() => updateFulfillment('PROCESSING')} disabled={actionLoading} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 font-medium disabled:opacity-50"><Box className="w-4 h-4" /> Start Processing</button>
            )}
            {order.fulfillmentStatus === 'PROCESSING' && (
              <div className="flex items-center gap-2 flex-1">
                <input value={trackingInfo} onChange={e => setTrackingInfo(e.target.value)} placeholder="Tracking Info (Optional)" className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:border-blue-500 flex-1 max-w-xs" />
                <button onClick={() => updateFulfillment('READY_FOR_DELIVERY')} disabled={actionLoading} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-sm hover:bg-cyan-100 font-medium disabled:opacity-50"><Truck className="w-4 h-4" /> Mark Ready / Shipped</button>
              </div>
            )}
            {order.fulfillmentStatus === 'READY_FOR_DELIVERY' && (
              <button onClick={() => updateFulfillment('DELIVERED')} disabled={actionLoading} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 font-medium disabled:opacity-50"><Package className="w-4 h-4" /> Mark Delivered</button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-400" /> Order Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><p className="text-gray-500">Auction</p><p className="font-medium text-gray-800 mt-1">{order.auction?.title}</p></div>
              <div><p className="text-gray-500">Requirement</p><p className="font-medium text-gray-800 mt-1">{order.requirement?.title}</p></div>
              <div><p className="text-gray-500">Quantity</p><p className="font-medium text-gray-800 mt-1">{order.quantity} units</p></div>
              <div><p className="text-gray-500">Total Amount</p><p className="font-bold text-blue-600 text-lg mt-0.5">{formatCurrency(order.amount)}</p></div>
              <div><p className="text-gray-500">Created At</p><p className="font-medium text-gray-800 mt-1">{formatDate(order.createdAt)}</p></div>
              <div><p className="text-gray-500">Delivery Deadline</p><p className="font-medium text-gray-800 mt-1">{formatDate(order.deliveryDeadline)}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-gray-400" /> Delivery Details</h3>
            <div className="space-y-4 text-sm">
              <div><p className="text-gray-500">Delivery Location</p><p className="font-medium text-gray-800 mt-1">{order.deliveryLocation}</p></div>
              {order.requirement?.specifications && (
                <div><p className="text-gray-500">Specifications</p><p className="text-gray-700 mt-1 whitespace-pre-line">{order.requirement.specifications}</p></div>
              )}
              {order.trackingInfo?.trackingNumber && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="font-semibold text-blue-800 mb-1">Tracking Information</p>
                  <p className="text-blue-600">Carrier: {order.trackingInfo.carrier || 'Standard'}</p>
                  <p className="text-blue-600">Ref/No: {order.trackingInfo.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4">Parties Involved</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Buyer</p>
                <p className="font-medium text-gray-800">{order.buyer?.name}</p>
                <p className="text-sm text-gray-500">{order.buyer?.company}</p>
                <p className="text-sm text-gray-500">{order.buyer?.email}</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Supplier</p>
                <p className="font-medium text-gray-800">{order.supplier?.name}</p>
                <p className="text-sm text-gray-500">{order.supplier?.company}</p>
                <p className="text-sm text-gray-500">{order.supplier?.email}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4">Payment Info</h3>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={order.paymentStatus || 'PENDING'} />
                </div>
                {order.paymentStatus === 'PAID' && (
                  <p className="text-xs text-green-600 text-right mt-2 font-medium">Payment has been cleared.</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
