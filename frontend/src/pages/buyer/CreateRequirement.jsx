import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requirementsAPI, categoriesAPI } from '../../api';
import toast from 'react-hot-toast';

export default function CreateRequirement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', productType: 'PRODUCT',
    quantity: 1, unit: 'units', specifications: '', estimatedBudget: '',
    deliveryLocation: '', deliveryDeadline: '', eligibilityRequirements: '',
    auctionStartDate: '', auctionEndDate: '', minimumBidDecrement: '',
    isPublic: true, vendorEligibilityCriteria: '',
  });

  useEffect(() => {
    const fetchCats = async () => {
      try { const { data } = await categoriesAPI.getAll(); if (data.success) setCategories(data.data); } catch {}
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.estimatedBudget) payload.estimatedBudget = Number(payload.estimatedBudget);
      if (payload.quantity) payload.quantity = Number(payload.quantity);
      if (payload.minimumBidDecrement) payload.minimumBidDecrement = Number(payload.minimumBidDecrement);
      
      const { data } = await requirementsAPI.create(payload);
      if (data.success) {
        toast.success('Requirement created!');
        navigate(`/buyer/requirements/${data.data._id}`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create Procurement Requirement</h1>
        <p className="text-gray-500 mt-1">Define your procurement needs</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-3">Basic Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => updateField('title', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required placeholder="e.g., Procurement of 100 Business Laptops" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => updateField('category', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.productType} onChange={e => updateField('productType', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" value={form.quantity} onChange={e => updateField('quantity', e.target.value)} min="1" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input value={form.unit} onChange={e => updateField('unit', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
            <textarea value={form.specifications} onChange={e => updateField('specifications', e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-3">Budget & Delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget (₹) *</label>
              <input type="number" value={form.estimatedBudget} onChange={e => updateField('estimatedBudget', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Bid Decrement (₹)</label>
              <input type="number" value={form.minimumBidDecrement} onChange={e => updateField('minimumBidDecrement', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location *</label>
              <input value={form.deliveryLocation} onChange={e => updateField('deliveryLocation', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Deadline *</label>
              <input type="date" value={form.deliveryDeadline} onChange={e => updateField('deliveryDeadline', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-3">Auction Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auction Start Date/Time</label>
              <input type="datetime-local" value={form.auctionStartDate} onChange={e => updateField('auctionStartDate', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auction End Date/Time</label>
              <input type="datetime-local" value={form.auctionEndDate} onChange={e => updateField('auctionEndDate', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Requirements</label>
            <textarea value={form.eligibilityRequirements} onChange={e => updateField('eligibilityRequirements', e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.isPublic} onChange={e => updateField('isPublic', e.target.checked)} id="isPublic" className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="isPublic" className="text-sm text-gray-700">Make auction publicly visible</label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/buyer/requirements')} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Requirement'}
          </button>
        </div>
      </form>
    </div>
  );
}
