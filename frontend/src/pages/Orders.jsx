import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { attachFallback, resolveImageUrl } from '../utils/assets';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch order history.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user]);

  if (loading) return <LoadingSpinner fullPage label="Loading order history..." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Order history</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">My Orders</h1>
      </div>

      {error ? (
        <EmptyState
          title="Order history unavailable"
          description={error}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you complete checkout, your order history will appear here."
          action={<Link to="/shop" className="btn-primary">Start shopping</Link>}
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="glass-card">
              <div className="flex flex-col gap-4 border-b border-slate-200/60 bg-slate-50/40 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Order Placed</p>
                    <p className="font-medium text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Total</p>
                    <p className="font-medium text-slate-900">₹{Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Shipping</p>
                    <p className="font-medium text-slate-900">
                      {Number(order.shipping_fee) > 0 ? `₹${Number(order.shipping_fee).toFixed(2)}` : <span className="text-emerald-600 font-semibold">FREE</span>}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Order #</p>
                    <p className="font-medium text-slate-900">{order.id}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide
                    ${order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200'}`}>
                    {order.status}
                  </span>
                  {order.tracking_number && (
                    <a
                      href={`https://www.delhivery.com/track/?ref=${order.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-primary-dark transition hover:bg-slate-100"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      Track via Delhivery: {order.tracking_number}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6 p-8">
                <div className="flex w-full gap-4 overflow-x-auto pb-2">
                  {(order.items || []).slice(0, 4).map((item, index) => {
                    if (index === 3 && order.items.length > 4) {
                      return (
                        <div key="more" className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500">
                          +{order.items.length - 3} more
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                        <img
                          src={resolveImageUrl(item.image_url, item.name)}
                          alt={item.name}
                          onError={(event) => attachFallback(event, item.name)}
                          className="h-full w-full object-contain mix-blend-multiply contrast-[1.05] brightness-[1.05]"
                        />
                        
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                          <span className="text-[10px] text-white font-medium text-center px-1 line-clamp-2">
                            {item.name}
                          </span>
                        </div>

                        {item.quantity > 1 && (
                          <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl shadow-sm">
                            x{item.quantity}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100/50">
                  <p className="text-sm font-semibold text-slate-500">
                    {order.items?.length || 0} items in this order
                  </p>
                  <Link
                    to={`/orders/${order.id}`}
                    className="btn-secondary"
                  >
                    View order details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
