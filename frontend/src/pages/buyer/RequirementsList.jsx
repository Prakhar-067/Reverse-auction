import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requirementsAPI } from '../../api';
import { StatusBadge, LoadingSpinner, EmptyState, formatCurrency, formatDate } from '../../components/common/UIComponents';
import { FileText, Plus, Search } from 'lucide-react';

export default function RequirementsList() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await requirementsAPI.getAll(params);
      if (data.success) { setRequirements(data.data); setPagination(data.pagination); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);

  const statuses = ['DRAFT', 'PENDING_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'COMPLETED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Requirements</h1>
          <p className="text-gray-500 mt-1">Manage procurement requirements</p>
        </div>
        <Link to="/buyer/requirements/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Requirement
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="min-h-[300px]" /> : requirements.length === 0 ? (
        <EmptyState icon={FileText} title="No requirements found" description="Create your first procurement requirement" action={<Link to="/buyer/requirements/new" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Create Requirement</Link>} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Budget</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
              </tr></thead>
              <tbody>
                {requirements.map(r => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/buyer/requirements/${r._id}`)}>
                    <td className="py-3 px-4 font-medium text-gray-800">{r.title}</td>
                    <td className="py-3 px-4 text-gray-600">{r.category?.name || '—'}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(r.estimatedBudget)}</td>
                    <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Prev</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => fetchData(pagination.page + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
