import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function OrderDetails() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Order details</p>
          <h1 className="text-3xl font-black text-slate-900">Order #{id}</h1>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
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
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="text-sm text-slate-700">
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4">{item.category || 'Uniform'}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4 font-semibold">₹{Number(item.price_at_purchase).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
