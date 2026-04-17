import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ── Sentiment colours & labels ──────────────────────────
const SENTIMENT_CONFIG = {
  POSITIVE: { color: 'emerald', emoji: '😊', label: 'Positive' },
  NEGATIVE: { color: 'rose',    emoji: '😞', label: 'Negative' },
  MIXED:    { color: 'amber',   emoji: '🤔', label: 'Mixed'    },
  NEUTRAL:  { color: 'slate',   emoji: '😐', label: 'Neutral'  },
};

export default function ReviewModal({ isOpen, onClose, productId, productName }) {
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setReviewText('');
      setRating(5);
      setResult(null);
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setError('Please write a review before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/reviews', {
        productId,
        reviewText: reviewText.trim(),
        rating,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sentimentInfo = result?.sentiment ? SENTIMENT_CONFIG[result.sentiment] || SENTIMENT_CONFIG.NEUTRAL : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
                Leave a review
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 line-clamp-1">
                {productName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* ── Success State ───────────────────────── */}
          {result ? (
            <div className="space-y-5">
              {/* Sentiment Badge */}
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <span className="text-5xl">{sentimentInfo?.emoji}</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-500">AI Sentiment Analysis</p>
                  <p className={`mt-1 text-2xl font-black text-${sentimentInfo?.color}-600`}>
                    {sentimentInfo?.label}
                  </p>
                </div>
              </div>

              {/* Confidence Bars */}
              {result.sentimentScore && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Confidence Breakdown
                  </p>
                  {Object.entries(result.sentimentScore).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-16 text-xs font-semibold capitalize text-slate-500">
                        {key}
                      </span>
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            key === 'positive' ? 'bg-emerald-500' :
                            key === 'negative' ? 'bg-rose-500' :
                            key === 'mixed'    ? 'bg-amber-500' :
                                                 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.round(value * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-bold text-slate-600">
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Engine Tag */}
              {result.engine && (
                <p className="text-center text-[11px] font-semibold text-slate-400">
                  Powered by {result.engine === 'COMPREHEND' ? 'Amazon Comprehend' : 'Local NLP Engine'}
                </p>
              )}

              <button
                onClick={onClose}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Form State ─────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-125 ${
                        star <= rating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 self-center text-sm font-semibold text-slate-500">
                    {rating}/5
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label
                  htmlFor="review-text"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Your review
                </label>
                <textarea
                  ref={textareaRef}
                  id="review-text"
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about your experience with this product..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  disabled={loading}
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">
                  {reviewText.length} characters
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !reviewText.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing Sentiment…
                  </span>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
