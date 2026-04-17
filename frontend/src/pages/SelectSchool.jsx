import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { attachFallback, resolveImageUrl } from '../utils/assets';

export default function SelectSchool() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSchools = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/schools');
      setSchools(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load schools right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleSelectSchool = (schoolId) => {
    localStorage.setItem('selectedSchool', schoolId);
    navigate('/shop');
  };

  if (loading) return <LoadingSpinner fullPage label="Loading schools..." />;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#eef2ff,_#f8fafc_24%,_#f8fafc)] px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">Choose your campus</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Select Your School</h1>
          <p className="mt-3 text-base text-slate-500">
            We’ll tailor the catalog, grade groups, and checkout flow to the school you pick here.
          </p>
        </div>

        {error ? (
          <EmptyState
            title="School directory unavailable"
            description={error}
            action={
              <button
                type="button"
                onClick={fetchSchools}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Try again
              </button>
            }
          />
        ) : schools.length === 0 ? (
          <EmptyState
            title="No schools available yet"
            description="Your backend returned an empty school list, so there is nothing to browse right now."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {schools.map((school) => (
              <button
                key={school.id}
                type="button"
                onClick={() => handleSelectSchool(school.id)}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden bg-slate-50 p-6 flex items-center justify-center">
                  <img
                    src={resolveImageUrl(school.image_url, school.name, 'school')}
                    alt={school.name}
                    onError={(event) => attachFallback(event, school.name, 'school')}
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">Official catalog</p>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">{school.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{school.location || 'Location available at checkout'}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    Shop this school
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
