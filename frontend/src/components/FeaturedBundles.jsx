import { useState, useEffect } from 'react';
import axios from 'axios';

export default function FeaturedBundles({ schoolId, onAddBundleToCart }) {
  const [bundles, setBundles] = useState([]);
  
  useEffect(() => {
    if (!schoolId) return;
    axios.get(`/api/bundles/${schoolId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setBundles(res.data))
    .catch(console.error);
  }, [schoolId]);

  if (bundles.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">1-Click Uniform Bundles</h2>
        <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border border-blue-200">Featured</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle, idx) => (
          <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden flex flex-col group hover:shadow-sm transition">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 group-hover:opacity-20 transition"></div>
            
            <h3 className="text-xl font-bold text-blue-900 mb-1">{bundle.bundle_name}</h3>
            <p className="text-sm text-blue-700 mb-5 font-semibold border-b border-blue-200/60 pb-3">All mandatory items, single click.</p>
            
            <div className="flex-1">
              <ul className="space-y-3 mb-6">
                {bundle.bundle_contents.required.map((item, i) => (
                  <li key={i} className="flex flex-start items-center text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-emerald-500 mr-2 shrink-0 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span><span className="font-bold text-slate-900">{item.qty}x</span> {item.item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto pt-5 border-t border-blue-200/60 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider mb-1">Bundle Total</span>
                <span className="text-2xl font-black text-slate-900 leading-none">₹{bundle.total_price}</span>
              </div>
              <button 
                onClick={() => onAddBundleToCart(bundle)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
