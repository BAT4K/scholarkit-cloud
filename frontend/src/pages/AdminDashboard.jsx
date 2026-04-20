import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ProductFormModal from '../components/ProductFormModal';
import { attachFallback, resolveImageUrl } from '../utils/assets';
import { Trophy, Activity, Plus, Database, Zap, Cloud } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, lowStockCount: 0 });
  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState({});
  const [inventoryValue, setInventoryValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  // Product Management state
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Helper for Auth Headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, ordersRes, topProductsRes, inventoryRes] = await Promise.all([
        axios.get('/api/admin/stats', getAuthHeaders()),
        axios.get('/api/admin/orders', getAuthHeaders()),
        axios.get('/api/analytics/top-products', getAuthHeaders()),
        axios.get('/api/admin/inventory-value', getAuthHeaders())
      ]);
      
      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setInventoryValue(inventoryRes.data.totalInventoryValue || 0);

      const groupedProducts = topProductsRes.data.reduce((acc, curr) => {
        if (!acc[curr.school_name]) acc[curr.school_name] = [];
        acc[curr.school_name].push(curr);
        return acc;
      }, {});
      
      setTopProducts(groupedProducts);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Action: Update Order Status
  const [trackingInputs, setTrackingInputs] = useState({});

  const updateStatus = async (orderId, newStatus, trackingNumber) => {
    try {
      const body = { status: newStatus };
      if (trackingNumber) body.tracking_number = trackingNumber;
      await axios.put(`/api/admin/orders/${orderId}`, body, getAuthHeaders());
      fetchData();
      toast.success(`Order #${orderId} marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Product Management functions
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get('/api/products/seller', getAuthHeaders());
      setAllProducts(res.data);
    } catch {
      toast.error('Failed to load products.');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axios.delete(`/api/products/${id}`, getAuthHeaders());
      setAllProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  useEffect(() => {
    if (activeTab === 'products' && allProducts.length === 0) fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (loading) return <LoadingSpinner fullPage label="Loading dashboard analytics..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {[{key: 'analytics', label: 'Analytics'}, {key: 'orders', label: 'Orders'}, {key: 'products', label: 'Products'}].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-white text-primary-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-8">
          <EmptyState
            title="Dashboard unavailable"
            description={error}
            action={<button onClick={fetchData} className="btn-primary">Retry</button>}
          />
        </div>
      ) : null}
      {/* --- TAB: ANALYTICS --- */}
      {activeTab === 'analytics' && (
      <>
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Best Sellers by School
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(topProducts).length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="No leaderboard data yet" description="Top product analytics will appear once orders start flowing through the system." />
            </div>
          ) : Object.entries(topProducts).map(([schoolName, products]) => (
            <div key={schoolName} className="glass-card p-6 hover:-translate-y-1 transition duration-300">
              <h3 className="font-black text-lg text-slate-900 mb-4 pb-3 border-b border-slate-100/50">{schoolName}</h3>
              <div className="space-y-4">
                {products.slice(0, 3).map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm
                        ${product.sales_rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' : 
                          product.sales_rank === 2 ? 'bg-slate-50 text-slate-500' : 
                          'bg-orange-50 text-orange-400'}`}>
                        {product.sales_rank === 1 ? <Trophy className="w-4 h-4" /> : `#${product.sales_rank}`}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition">{product.product_name}</p>
                        <p className="text-xs text-slate-500 font-medium">{product.total_sold} units sold</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION A: STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="glass-card p-6 hover:-translate-y-1 transition duration-300 overflow-hidden">
          <p className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</p>
          <p className="text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight truncate" title={`₹${stats.totalRevenue}`}>₹{Number(stats.totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="glass-card p-6 border-indigo-200/50 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 hover:-translate-y-1 transition duration-300 overflow-hidden">
          <p className="mb-2 block text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            Inventory Value
          </p>
          <p className="text-2xl lg:text-3xl font-black text-primary-dark tracking-tight truncate" title={`₹${inventoryValue}`}>₹{Number(inventoryValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-indigo-400 mt-1 font-bold">via SQL Cursor</p>
        </div>
        <div className="glass-card p-6 hover:-translate-y-1 transition duration-300 overflow-hidden">
          <p className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Total Orders</p>
          <p className="text-2xl lg:text-3xl font-black text-blue-600 tracking-tight truncate">{stats.totalOrders}</p>
        </div>
        <div className="glass-card p-6 hover:-translate-y-1 transition duration-300 overflow-hidden">
          <p className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Active Users</p>
          <p className="text-2xl lg:text-3xl font-black text-purple-600 tracking-tight truncate">{stats.totalUsers}</p>
        </div>
        <div className={`glass-card p-6 hover:-translate-y-1 transition duration-300 overflow-hidden ${stats.lowStockCount > 0 ? 'border-rose-200/50 bg-rose-50/30' : ''}`}>
          <p className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Alerts</p>
          <p className={`text-2xl lg:text-3xl font-black tracking-tight truncate ${stats.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {stats.lowStockCount}
          </p>
        </div>
      </div>
      </>
      )}

      {/* --- TAB: ORDERS --- */}
      {activeTab === 'orders' && (
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/50 bg-slate-50/50 backdrop-blur-sm">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 box-border text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/50">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Tracking</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">#{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{order.user_name}</div>
                    <div className="text-slate-500 text-xs">{order.user_email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-700">₹{order.total_amount}</div>
                    {Number(order.shipping_fee) > 0 && (
                      <div className="text-[10px] text-slate-400">incl. ₹{Number(order.shipping_fee).toFixed(0)} shipping</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {order.tracking_number ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-primary-dark">
                        {order.tracking_number}
                      </span>
                    ) : order.status === 'Pending' ? (
                      <input
                        type="text"
                        placeholder="AWB-XXXXXX"
                        value={trackingInputs[order.id] || ''}
                        onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-slate-100"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                      ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'Pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'Shipped', trackingInputs[order.id] || null)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
                      >
                        Mark Shipped
                      </button>
                    )}
                    {order.status === 'Shipped' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'Delivered')}
                        className="text-green-600 hover:text-green-800 font-semibold text-xs border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-slate-500">No orders available yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* --- TAB: PRODUCTS --- */}
      {activeTab === 'products' && (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
          <button
            onClick={() => { setEditingProduct(null); setFormOpen(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {productsLoading ? (
          <LoadingSpinner label="Loading products..." />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 box-border text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/50">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">School</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {allProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border overflow-hidden flex-shrink-0">
                            <img src={resolveImageUrl(p.image_url, p.name)} alt={p.name} onError={(e) => attachFallback(e, p.name)} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-primary transition">{p.name}</div>
                            <div className="text-[11px] text-slate-400">#{p.id} • {p.category || 'Uniform'}{p.size ? ` • ${p.size}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{p.school_name || '—'}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">₹{p.price}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${p.stock < 10 ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span>
                      </td>
                      <td className="px-6 py-4">
                        {p.discount_percent > 0 ? (
                          <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-bold">{p.discount_percent}%</span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingProduct(p); setFormOpen(true); }}
                            className="text-xs font-bold text-primary hover:text-indigo-800 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-md transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 py-1.5 px-3 rounded-md transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allProducts.length === 0 && (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ProductFormModal
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setEditingProduct(null); }}
          onSaved={fetchProducts}
          product={editingProduct}
          isAdmin={true}
        />
      </div>
      )}

      {/* --- SECTION C: SYSTEM ARCHITECTURE & LIMITATIONS --- */}
      <div className="mt-10 rounded-[2rem] border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-8 shadow-sm backdrop-blur-md">
        <h2 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-2 tracking-tight">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          System Architecture & Limitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-amber-200/50 shadow-none hover:shadow-md transition duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/50 text-amber-700">
                <Database className="w-5 h-5 text-amber-700" />
              </span>
              <h3 className="font-black text-sm text-amber-900 uppercase tracking-wide">Scalability</h3>
            </div>
            <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
              Currently relies on a single relational MySQL instance. Horizontal scaling would require database sharding or migrating JSON bundles to a dedicated NoSQL store.
            </p>
          </div>
          <div className="glass-card p-6 border-amber-200/50 shadow-none hover:shadow-md transition duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/50 text-amber-700">
                <Zap className="w-5 h-5 text-amber-700" />
              </span>
              <h3 className="font-black text-sm text-amber-900 uppercase tracking-wide">Concurrency</h3>
            </div>
            <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
              Heavy concurrent checkout requests for the exact same uniform variant could lead to transaction deadlocks or race conditions on stock decrement.
            </p>
          </div>
          <div className="glass-card p-6 border-amber-200/50 shadow-none hover:shadow-md transition duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/50 text-amber-700">
                <Cloud className="w-5 h-5 text-amber-700" />
              </span>
              <h3 className="font-black text-sm text-amber-900 uppercase tracking-wide">API Dependencies</h3>
            </div>
            <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
              Payment processing relies entirely on the Razorpay API. A fallback gateway (e.g., PayU or Stripe) is required for true high availability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}