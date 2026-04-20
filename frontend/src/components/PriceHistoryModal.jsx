import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

export default function PriceHistoryModal({ productId, isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !productId) {
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/products/${productId}/price-history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setHistory(res.data);
      } catch {
        setError('Price history is unavailable for this product right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <h2 className="text-lg font-bold text-gray-800">Price Transparency</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 pb-1 text-2xl font-light transition">&times;</button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
            We actively monitor price changes to ensure fair uniform pricing throughout the entire academic year.
          </p>

          <div className="max-h-72 overflow-y-auto pr-2">
            {loading ? (
              <LoadingSpinner label="Loading history..." className="py-8" />
            ) : error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">{error}</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">No price changes recorded.</div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-2">
                {history.map((record, idx) => {
                  const isDrop = record.new_price < record.old_price;
                  return (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-[3px] border-white shadow-sm ${isDrop ? 'bg-green-500' : 'bg-red-400'}`} />
                      
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm w-full">
                        <div className="flex flex-wrap items-center justify-between mb-1 gap-4 w-full">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-900 text-lg">₹{record.new_price}</span>
                            {isDrop && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold uppercase tracking-widest shadow-sm">Price Dropped</span>}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{new Date(record.changed_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm text-slate-500 font-semibold mt-2">
                          Previous price: <span className="line-through text-slate-400 font-bold ml-1">₹{record.old_price}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
