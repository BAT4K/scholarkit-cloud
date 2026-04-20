import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  Orbit, 
  X, 
  Sparkles, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';

// ── Sentiment Config ──────────────────────────
const SENTIMENT_CONFIG = {
  POSITIVE: { 
    color: 'emerald', 
    icon: ThumbsUp, 
    label: 'Positive',
    bg: 'from-emerald-500/10 to-emerald-500/5',
    text: 'text-emerald-700',
    bar: 'bg-emerald-500'
  },
  NEGATIVE: { 
    color: 'rose',    
    icon: ThumbsDown, 
    label: 'Negative',
    bg: 'from-rose-500/10 to-rose-500/5',
    text: 'text-rose-700',
    bar: 'bg-rose-500'
  },
  MIXED: { 
    color: 'amber',   
    icon: Orbit, 
    label: 'Mixed',
    bg: 'from-amber-500/10 to-amber-500/5',
    text: 'text-amber-700',
    bar: 'bg-amber-500'
  },
  NEUTRAL: { 
    color: 'slate',   
    icon: Minus, 
    label: 'Neutral',
    bg: 'from-slate-500/10 to-slate-500/5',
    text: 'text-slate-700',
    bar: 'bg-slate-500'
  },
};

export default function ReviewModal({ isOpen, onClose, productId, productName }) {
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setReviewText('');
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
      const res = await axios.post(`/api/products/${productId}/reviews`, {
        reviewText: reviewText.trim(),
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

  const sentimentInfo = result?.sentiment ? SENTIMENT_CONFIG[result.sentiment] || SENTIMENT_CONFIG.NEUTRAL : null;
  const Icon = sentimentInfo?.icon;

  const getEngineLabel = (engine) => {
    if (engine === 'HUGGING_FACE') return 'Hugging Face AI';
    if (engine === 'GCP_NLP') return 'Google Cloud NLP';
    if (engine === 'COMPREHEND') return 'Amazon Comprehend';
    if (engine === 'AZURE_AI_LANGUAGE') return 'Azure AI Language';
    return 'AI Engine';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="glass-card relative w-full max-w-lg border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/60 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                AI-Powered Review
              </p>
            </div>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900 line-clamp-1">
              {productName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* ── Success State ───────────────────────── */}
          {result ? (
            <div className="space-y-6">
              {/* Premium Sentiment Badge */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${sentimentInfo?.bg} border border-${sentimentInfo?.color}-100 p-8 text-center shadow-inner`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
                  {Icon && <Icon className={`h-8 w-8 ${sentimentInfo?.text}`} strokeWidth={2.5} />}
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Analysis Result
                </p>
                <p className={`mt-1 text-3xl font-black tracking-tight ${sentimentInfo?.text}`}>
                  {sentimentInfo?.label}
                </p>
                {/* Decorative blurred blob */}
                <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-${sentimentInfo?.color}-400/20 blur-2xl`} />
              </div>

              {/* Confidence Breakdown - Data Viz Style */}
              {result.sentimentScore && (
                <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-5 shadow-sm">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Confidence Distribution
                  </p>
                  <div className="space-y-3">
                    {Object.entries(result.sentimentScore).map(([key, value]) => {
                      const config = SENTIMENT_CONFIG[key.toUpperCase()] || SENTIMENT_CONFIG.NEUTRAL;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-16 text-xs font-bold capitalize text-slate-600">
                            {key}
                          </span>
                          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${config.bar}`}
                              style={{ width: `${Math.round(value * 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-bold text-slate-700">
                            {Math.round(value * 100)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Engine Tag */}
              {result.engine && (
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider">
                    Processed by {getEngineLabel(result.engine)}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="btn-primary w-full py-3 shadow-lg"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Form State ─────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Review Text Area */}
              <div className="group">
                <label
                  htmlFor="review-text"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-primary"
                >
                  Your Perspective
                </label>
                <textarea
                  ref={textareaRef}
                  id="review-text"
                  rows={5}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your detailed experience. Our AI will analyze the sentiment of your feedback..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-800 shadow-sm backdrop-blur-sm placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                  disabled={loading}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-400">
                    {reviewText.length} characters
                  </p>
                  <p className="text-[11px] font-medium text-slate-400">
                    Minimum 10 chars for accurate analysis
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || reviewText.trim().length < 10}
                className="btn-primary relative w-full overflow-hidden py-3 shadow-lg disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Sentiment...
                  </span>
                ) : (
                  'Submit for Analysis'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
