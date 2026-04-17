import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { attachFallback, resolveImageUrl } from '../utils/assets';

export default function Cart() {
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');


  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchCart = async () => {
    try {
      setError('');
      const res = await axios.get('/api/cart', getAuthHeaders());
      setCartItems(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
      await axios.put(`/api/cart/${id}`, { quantity: newQuantity }, getAuthHeaders());
      refreshCartCount();
    } catch {
      toast.error('Unable to update quantity right now.');
      fetchCart();
    }
  };

  const removeItem = async (id) => {
    try {
      await axios.delete(`/api/cart/${id}`, getAuthHeaders());
      setCartItems(prev => prev.filter(item => item.id !== id));
      refreshCartCount();
    } catch {
      toast.error('Unable to remove item right now.');
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);

    try {
      // Direct checkout via DynamoDB TransactWriteItems
      const res = await axios.post('/api/orders/checkout', {}, getAuthHeaders());

      toast.success('Order placed successfully!');
      refreshCartCount();
      setCartItems([]);

      navigate('/order-success', {
        state: { orderId: res.data.orderId }
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  // Calculate totals with discounts
  const getDiscountedPrice = (item) => {
    const price = Number(item.price);
    const discount = Number(item.discount_percent) || 0;
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (getDiscountedPrice(item) * item.quantity), 0);
  const shippingFee = cartSubtotal > 0 && cartSubtotal < 1000 ? 50 : 0;
  const cartTotal = cartSubtotal + shippingFee;

  if (loading) return <LoadingSpinner fullPage label="Loading cart..." />;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">Checkout</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Your Shopping Cart</h1>
      </div>

      {error ? (
        <EmptyState
          title="Cart unavailable"
          description={error}
          action={
            <button onClick={fetchCart} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
              Try again
            </button>
          }
        />
      ) : cartItems.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Pick a school and add a few essentials before starting checkout."
          action={
            <button onClick={() => navigate('/shop')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
              Go to shop
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-4 text-slate-500 font-medium">Product</th>
                  <th className="p-4 text-slate-500 font-medium">Qty</th>
                  <th className="p-4 text-slate-500 font-medium">Price</th>
                  <th className="p-4 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cartItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                          <img src={resolveImageUrl(item.image_url, item.name)} alt={item.name} onError={(event) => attachFallback(event, item.name)} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">Size: {item.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex w-fit items-center rounded-xl border border-slate-300">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-2 hover:bg-slate-100">-</button>
                        <span className="px-2 text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2 hover:bg-slate-100">+</button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        {Number(item.discount_percent) > 0 ? (
                          <>
                            <span className="text-xs text-slate-400 line-through">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                            <span className="font-bold text-emerald-700">₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</span>
                            <span className="mt-0.5 text-[10px] font-bold text-rose-600">{item.discount_percent}% off</span>
                          </>
                        ) : (
                          <span className="font-bold text-slate-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-600">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <img src={resolveImageUrl(item.image_url, item.name)} alt={item.name} onError={(event) => attachFallback(event, item.name)} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Size: {item.size}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-slate-300">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-2">-</button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-sm font-semibold text-rose-600">
                        Remove
                      </button>
                    </div>
                    <p className="text-right text-sm font-bold">
                      {Number(item.discount_percent) > 0 ? (
                        <>
                          <span className="mr-1 text-slate-400 line-through">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          <span className="text-emerald-700">₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-slate-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black mb-4 text-slate-900">Order Summary</h2>
            <div className="space-y-3 border-t pt-4 mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                {shippingFee > 0 ? (
                  <span className="font-semibold text-slate-800">₹{shippingFee.toFixed(2)}</span>
                ) : (
                  <span className="font-semibold text-emerald-600">FREE</span>
                )}
              </div>
              {shippingFee > 0 && (
                <p className="text-[11px] text-slate-400">Add ₹{(1000 - cartSubtotal).toFixed(0)} more for free shipping</p>
              )}
            </div>
            <div className="mb-6 flex justify-between border-t pt-4">
              <span className="text-xl font-bold">Total</span>
              <span className="text-xl font-black text-indigo-700">₹{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {checkingOut ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
