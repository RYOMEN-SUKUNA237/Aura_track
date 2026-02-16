import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, X, Eye, ChevronDown, Building2, User, Trash2,
  Mail, Phone, MapPin, CheckCircle, Loader2
} from 'lucide-react';
import * as api from '../../services/api';

interface Customer {
  id: number;
  customer_id: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CustomersProps {
  onRefresh: () => void;
}

const Customers: React.FC<CustomersProps> = ({ onRefresh }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '',
    address: '', city: '', state: '', country: 'US', postal_code: '',
    type: 'individual', notes: '',
  });

  const fetchCustomers = async () => {
    try {
      const res = await api.customers.list({ limit: 200 });
      setCustomers(res.customers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreate = async () => {
    if (!form.contact_name || !form.email || !form.phone) return;
    setSaving(true);
    try {
      await api.customers.create({
        contact_name: form.contact_name,
        company_name: form.company_name || undefined,
        email: form.email,
        phone: form.phone,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country,
        postal_code: form.postal_code || undefined,
        type: form.type,
        notes: form.notes || undefined,
      });
      setForm({ contact_name: '', company_name: '', email: '', phone: '', address: '', city: '', state: '', country: 'US', postal_code: '', type: 'individual', notes: '' });
      setShowCreate(false);
      fetchCustomers();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to register customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete customer ${customer.contact_name}?`)) return;
    try {
      await api.customers.delete(customer.customer_id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer.');
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0a192f]">Customer Management</h2>
          <p className="text-sm text-gray-500">{customers.length} registered customers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-[#0a192f] text-white text-sm font-medium rounded-lg hover:bg-[#112d57] transition-colors flex items-center gap-2 self-start sm:self-auto">
          <UserPlus size={16} /> Register Customer
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#0a192f]">Register New Customer</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Contact Name *</label>
                  <input type="text" value={form.contact_name} onChange={(e) => setForm(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="John Smith" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Company Name</label>
                  <input type="text" value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Optional" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="john@company.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Phone *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 555-0100" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Street address" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Houston" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">State</label>
                  <input type="text" value={form.state} onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))}
                    placeholder="TX" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Postal Code</label>
                  <input type="text" value={form.postal_code} onChange={(e) => setForm(p => ({ ...p, postal_code: e.target.value }))}
                    placeholder="77001" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Type</label>
                  <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] outline-none bg-white">
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Additional notes..." rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={!form.contact_name || !form.email || !form.phone || saving}
                  className="flex-1 px-4 py-2.5 bg-[#0a192f] text-white text-sm font-medium rounded-lg hover:bg-[#112d57] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#0a192f]">Customer Details</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${selectedCustomer.type === 'business' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                  {selectedCustomer.contact_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0a192f]">{selectedCustomer.contact_name}</p>
                  {selectedCustomer.company_name && <p className="text-sm text-gray-500">{selectedCustomer.company_name}</p>}
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{selectedCustomer.customer_id}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2"><Mail size={14} className="text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-[#0a192f]">{selectedCustomer.email}</p></div></div>
                <div className="flex items-start gap-2"><Phone size={14} className="text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Phone</p><p className="font-medium text-[#0a192f]">{selectedCustomer.phone}</p></div></div>
                {selectedCustomer.address && (
                  <div className="col-span-2 flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Address</p><p className="font-medium text-[#0a192f]">{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.postal_code}</p></div></div>
                )}
              </div>
              {selectedCustomer.notes && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600"><p className="text-xs text-gray-500 mb-1">Notes</p>{selectedCustomer.notes}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, email, or company..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] outline-none" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a192f] outline-none bg-white">
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${customer.type === 'business' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {customer.contact_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0a192f] truncate">{customer.contact_name}</p>
                        {customer.company_name && <p className="text-xs text-gray-400 truncate">{customer.company_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{customer.customer_id}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                      customer.type === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {customer.type === 'business' ? <Building2 size={12} /> : <User size={12} />}
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-600">{[customer.city, customer.state].filter(Boolean).join(', ') || '—'}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <p className="text-sm text-gray-600">{customer.email}</p>
                    <p className="text-xs text-gray-400">{customer.phone}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedCustomer(customer)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[#0a192f]" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDelete(customer)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
