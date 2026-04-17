import { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/shop');
      return;
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-6">
          Thank you for your purchase. Your order has been confirmed.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-8 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Order ID</p>
          <p className="text-lg font-mono font-bold text-gray-800">#{orderId}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            to="/orders" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Track Order
          </Link>
          <Link 
            to="/shop" 
            className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}