import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ReviewModal from '../components/ReviewModal';
import { attachFallback, resolveImageUrl } from '../utils/assets';

export default function OrderDetails() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openReviewModal = (product) => {
    setSelectedProduct(product);
    setReviewModalOpen(true);
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load order details right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullPage label="Loading order details..." />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Order details</p>
          <h1 className="text-3xl font-black text-slate-900">Order #{id}</h1>
        </div>
        <Link
          to="/orders"
          className="btn-secondary"
        >
          Back to my orders
        </Link>
      </div>

      {error ? (
        <EmptyState
          title="Order details unavailable"
          description={error}
          action={
            <Link
              to="/orders"
              className="btn-primary"
            >
              View order history
            </Link>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No items found"
          description="This order does not have any line items available to display."
        />
      ) : (
        <div className="glass-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-400">Product</th>
                  <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-400">Category</th>
                  <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Qty</th>
                  <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Price</th>
                  <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100/50 p-2 border border-slate-100">
                          <img 
                            src={resolveImageUrl(item.image_url, item.name)} 
                            alt={item.name} 
                            onError={(event) => attachFallback(event, item.name)} 
                            className="h-full w-full object-contain mix-blend-multiply contrast-[1.05] brightness-[1.05]" 
                          />
                        </div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{item.category || 'Uniform'}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-slate-900">₹{(Number(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openReviewModal(item)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-primary shadow-sm"
                      >
                        Write Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
        />
      )}
    </div>
  );
}
