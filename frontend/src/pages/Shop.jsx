import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import PriceHistoryModal from '../components/PriceHistoryModal';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { attachFallback, resolveImageUrl } from '../utils/assets';
import { Sparkles, ShoppingCart } from 'lucide-react';


const ProductCard = ({ product, onAddToCart }) => {
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const isOutOfStock = Number(product.stock) <= 0;
  const discount = Number(product.discount_percent) || 0;
  const originalPrice = Number(product.price);
  const finalPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

  return (
    <div className="group flex h-full flex-col glass-card bg-white hover:-translate-y-1">
      <div className="relative h-52 overflow-hidden bg-white p-4 flex items-center justify-center border-b border-slate-100">
        <img
          src={resolveImageUrl(product.image_url, product.name)}
          alt={product.name}
          onError={(event) => attachFallback(event, product.name)}
          className="h-full w-full object-contain mix-blend-multiply contrast-[1.05] brightness-[1.05] transition duration-500 group-hover:scale-110"
        />
        <div className="absolute left-4 top-4 inline-flex rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 shadow-sm border border-slate-200 backdrop-blur-md">
          {product.is_mandatory ? 'Required' : 'Optional'}
        </div>
        {discount > 0 && (
          <div className="absolute right-4 top-4 inline-flex rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-black text-slate-900">{product.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {product.category || 'Uniform'}{product.specific_gender ? ` • ${product.specific_gender}` : ''}
        </p>

        <div className="mb-4 mt-5 flex items-center gap-2">
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full"
          >
            {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex items-center rounded-lg border border-slate-300">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >-</button>
            <span className="min-w-10 px-2 text-center text-sm font-semibold text-slate-900 bg-slate-50">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >+</button>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-col">
            {discount > 0 ? (
              <>
                <span className="text-sm font-semibold text-slate-400 line-through">₹{originalPrice.toFixed(2)}</span>
                <span className="text-xl font-black text-emerald-700">₹{finalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-black text-slate-900">₹{originalPrice.toFixed(2)}</span>
            )}
            <button onClick={() => setShowHistory(true)} className="mt-1 text-left text-[11px] font-semibold text-slate-400 underline transition hover:text-primary">
              View price history
            </button>
          </div>
          <button
            onClick={() => onAddToCart(product, size, qty)}
            disabled={isOutOfStock}
            className="btn-primary"
          >
            {isOutOfStock ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
      <PriceHistoryModal productId={product.id} isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
};

export default function Shop() {
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [gender, setGender] = useState('Male');
  const [schoolId, setSchoolId] = useState(null);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedSchoolId = localStorage.getItem('selectedSchool');

    if (!storedSchoolId) {
      navigate('/select-school');
      return;
    }

    setSchoolId(storedSchoolId);

    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await axios.get(`/api/schools/${storedSchoolId}/groups`);
        setGroups(res.data);
        if (res.data.length > 0) setSelectedGroup(res.data[0].id);
      } catch {
        setError('Could not load school groups.');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [navigate]);

  // Fetch personalized recommendations for logged-in users
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    axios.get('/api/recommendations', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setRecommendations(res.data))
    .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!selectedGroup || !schoolId) return;

    const fetchCatalog = async () => {
      setLoadingProducts(true);
      setError('');
      try {
        const res = await axios.get(
          `/api/catalog?group_id=${selectedGroup}&gender=${gender}&school_id=${schoolId}`
        );
        setProducts(res.data);
      } catch {
        setError('Could not load products.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchCatalog();
  }, [selectedGroup, gender, schoolId]);

  const addToCart = async (product, size, quantity) => {
    const token = localStorage.getItem('token');
    if (!token || token === 'null') {
      toast.error('Please log in to add items to your cart.');
      navigate('/login', { state: { from: { pathname: '/shop' } } });
      return;
    }

    try {
      await axios.post('/api/cart', {
        product_id: product.id,
        quantity: quantity,
        size: size
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      refreshCartCount();
      toast.success(`Added ${quantity} x ${product.name} to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item to cart.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Shop uniforms</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900">School Uniforms</h1>
          <p className="mt-3 text-base text-slate-500">Welcome{user?.name ? `, ${user.name}` : ''}. Choose a grade and gender to view the exact catalog.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/select-school')}
          className="btn-secondary"
        >
          Change school
        </button>
      </div>

      <div className="mb-8 glass-card p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="mb-3 block text-xs font-black uppercase tracking-[0.25em] text-slate-400">Select grade</span>
            <div className="flex flex-wrap gap-2">
              {loadingGroups ? (
                <LoadingSpinner label="Loading groups..." className="justify-start py-0" />
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      selectedGroup === group.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {group.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="mb-3 block text-xs font-black uppercase tracking-[0.25em] text-slate-400">Select gender</span>
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200/50 shadow-inner">
              {['Male', 'Female'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-md px-5 py-2 text-sm font-semibold transition ${
                    gender === g ? 'bg-white text-primary-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS SECTION */}
      {recommendations.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl"><Sparkles className="w-5 h-5 text-accent" /></span>
            <h2 className="text-xl font-black text-slate-900">Recommended for You</h2>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-dark border border-slate-200">Based on past orders</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recommendations.map((rec) => {
              const disc = Number(rec.discount_percent) || 0;
              const origPrice = Number(rec.price);
              const discountedPrice = disc > 0 ? origPrice * (1 - disc / 100) : origPrice;
              return (
                <div key={rec.id} className="min-w-[220px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-sm">
                  <div className="relative mb-3 h-32 overflow-hidden rounded-lg bg-white p-2 flex items-center justify-center border border-slate-50">
                    <img src={resolveImageUrl(rec.image_url, rec.name)} alt={rec.name} onError={(e) => attachFallback(e, rec.name)} className="h-full w-full object-contain mix-blend-multiply contrast-[1.05] brightness-[1.05]" />
                    {disc > 0 && (
                      <div className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {disc}% OFF
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{rec.name}</h3>
                  <p className="mb-2 text-[11px] text-slate-400">{rec.school_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      {disc > 0 ? (
                        <>
                          <span className="text-xs text-slate-400 line-through">₹{origPrice.toFixed(0)}</span>
                          <span className="text-sm font-black text-emerald-700">₹{discountedPrice.toFixed(0)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-black text-slate-900">₹{origPrice.toFixed(0)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(rec, 'M', 1)}
                      className="ml-2 rounded-full bg-slate-100 p-1.5 text-slate-600 transition hover:bg-primary hover:text-white group-hover:bg-primary group-hover:text-white"
                      title="Quick Add to Cart (Size M)"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loadingProducts ? (
        <LoadingSpinner label="Loading catalog..." />
      ) : error ? (
        <EmptyState
          title="Catalog unavailable"
          description={error}
          action={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh page
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {products.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No products available"
                description={`We couldn't find any ${gender.toLowerCase()} catalog items for this grade group yet.`}
              />
            </div>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
