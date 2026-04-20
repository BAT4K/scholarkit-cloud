import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ProductFormModal from '../components/ProductFormModal';
import { attachFallback, resolveImageUrl } from '../utils/assets';
import { Layers, Pencil, Plus } from 'lucide-react';

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingRowId, setEditingRowId] = useState(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [updating, setUpdating] = useState(false);
  const selectedSchool = localStorage.getItem('selectedSchool');

  // Product form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/products/seller', {
        ...getAuthHeaders(),
        params: selectedSchool ? { school_id: selectedSchool } : {}
      });
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingRowId(product.id);
    setEditStockValue(product.stock.toString());
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditStockValue("");
  };

  const handleSaveStock = async (productId) => {
    const newStock = parseInt(editStockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Please enter a valid stock number.");
      return;
    }

    try {
      setUpdating(true);
      await axios.put(`/api/products/${productId}/stock`, { stock: newStock }, getAuthHeaders());
      
      setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      
      setEditingRowId(null);
      setEditStockValue("");
      toast.success("Stock updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/products/${productId}`, getAuthHeaders());
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Seller Inventory Management</h1>
          <p className="text-slate-500 mt-2 font-medium">Track stock levels, add new uniforms, and manage your catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddForm}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add New Uniform
          </button>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100">
            <Layers className="w-5 h-5" />
            {products.length} Total Items
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading inventory..." />
        ) : error ? (
          <div className="p-6">
            <EmptyState
              title="Inventory unavailable"
              description={error}
              action={<button onClick={fetchInventory} className="btn-primary">Retry</button>}
            />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-400 mb-2">
              <Layers className="mx-auto h-12 w-12 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium mb-4">No products found in your inventory.</p>
            <button onClick={openAddForm} className="btn-primary">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 box-border text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/50">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img src={resolveImageUrl(product.image_url, product.name)} alt={product.name} onError={(event) => attachFallback(event, product.name)} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{product.name}</div>
                          <div className="text-xs text-slate-400">ID: #{product.id}{product.school_name ? ` • ${product.school_name}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-gray-800">
                        {product.category || 'Uniform'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-700">₹{product.price}</span>
                      {Number(product.discount_percent) > 0 && (
                        <span className="ml-1 text-[10px] font-bold text-rose-600">{product.discount_percent}% off</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingRowId === product.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            className="bg-white border border-blue-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2 outline-none shadow-sm" 
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${product.stock < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                            {product.stock} units
                          </span>
                          {product.stock < 10 && (
                            <span className="inline-flex items-center bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-red-200">
                              Low Stock
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingRowId === product.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleSaveStock(product.id)}
                            disabled={updating}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors disabled:bg-green-400"
                          >
                            Save
                          </button>
                          <button 
                            onClick={handleCancelClick}
                            disabled={updating}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-bold rounded-md shadow-sm text-gray-700 bg-white hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(product)}
                            className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-md transition-colors"
                          >
                            Stock
                          </button>
                          <button 
                            onClick={() => openEditForm(product)}
                            className="inline-flex items-center text-xs font-bold text-primary hover:text-indigo-800 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 py-1.5 px-3 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Modal (isAdmin=false restricts school/seller fields) */}
      <ProductFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingProduct(null); }}
        onSaved={fetchInventory}
        product={editingProduct}
        isAdmin={false}
      />
    </div>
  );
}
