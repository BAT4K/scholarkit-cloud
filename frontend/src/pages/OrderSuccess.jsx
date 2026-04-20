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
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Decorative ambient blur behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-emerald-100/80 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-emerald-50/50">
          <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Order Confirmed</h1>
        <p className="text-sm font-medium text-slate-500 mb-8 px-2 leading-relaxed">
          Your transaction was completely successful. We'll send shipping updates directly to your email.
        </p>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-10 border border-white/80 shadow-sm ring-1 ring-black/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Transaction ID</p>
          <p className="text-3xl font-black tracking-tight text-primary-dark">#{orderId}</p>
        </div>

        <div className="flex flex-col gap-3.5">
          <Link 
            to="/orders" 
            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-black uppercase tracking-widest py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 inline-block"
          >
            Track Output
          </Link>
          <Link 
            to="/shop" 
            className="w-full bg-white/50 backdrop-blur-sm border-2 border-slate-200/60 text-slate-600 text-sm font-bold uppercase tracking-wide py-3.5 rounded-xl transition-all duration-300 hover:bg-white hover:border-slate-300 hover:text-slate-800 hover:-translate-y-0.5 inline-block"
          >
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}