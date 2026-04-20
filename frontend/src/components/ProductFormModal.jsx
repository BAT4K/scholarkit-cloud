import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', price: '', stock: '', category: '', school_id: '',
  discount_percent: '0', size: '', image_url: '', seller_id: '',
  grade_group: 'all', gender: 'unisex'
};

export default function ProductFormModal({ isOpen, onClose, onSaved, product, isAdmin }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [schools, setSchools] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Media Library state
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'library'
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const isEditing = !!product;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (!isOpen) return;

    // Load schools for selection
    axios.get('/api/products/schools', getAuthHeaders())
      .then(res => setSchools(res.data))
      .catch(() => {});

    // Populate form for editing
    if (product) {
      setForm({
        name: product.name || '',
        price: product.price || '',
        stock: product.stock || '',
        category: product.category || '',
        school_id: product.school_id || '',
        discount_percent: product.discount_percent || '0',
        size: product.size || '',
        image_url: product.image_url || '',
        seller_id: product.seller_id || '',
        grade_group: product.grade_group || 'all',
        gender: product.gender || 'unisex'
      });
      setImagePreview(product.image_url || '');
    } else {
      setForm(EMPTY_FORM);
      setImagePreview('');
    }
    setImageFile(null);
    setImageMode('upload');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  // Fetch gallery when user switches to library mode
  useEffect(() => {
    if (imageMode !== 'library' || gallery.length > 0) return;
    setGalleryLoading(true);
    axios.get('/api/products/images/gallery', getAuthHeaders())
      .then(res => setGallery(res.data))
      .catch(() => toast.error('Failed to load media library.'))
      .finally(() => setGalleryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageMode]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // Clear any library selection
    setForm(prev => ({ ...prev, image_url: '' }));
  };

  const selectFromGallery = (url) => {
    setForm(prev => ({ ...prev, image_url: url }));
    setImagePreview(url);
    setImageFile(null); // No new upload needed
    toast.success('Image selected from library.');
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_url; // Keep existing URL

    setUploading(true);
    try {
      // 1. Get presigned URL
      const presignRes = await axios.post('/api/admin/generate-upload-url', {
        filename: imageFile.name,
        fileType: imageFile.type
      }, getAuthHeaders());

      const { uploadUrl, publicUrl } = presignRes.data;

      // 2. Upload file directly to S3
      await axios.put(uploadUrl, imageFile, {
        headers: {
          'Content-Type': imageFile.type
        }
      });

      return publicUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.price) {
      toast.error('Name and Price are required.');
      return;
    }

    setSaving(true);
    try {
      // Step 1: Upload image if a new file was selected
      let finalImageUrl = form.image_url;
      if (imageFile) {
        finalImageUrl = await uploadImage();
      }

      // Step 2: Submit product data
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        category: form.category || null,
        discount_percent: parseInt(form.discount_percent) || 0,
        size: form.size || null,
        image_url: finalImageUrl || null,
        grade_group: form.grade_group || 'all',
        gender: form.gender || 'unisex'
      };

      if (isAdmin || !product) {
        payload.school_id = form.school_id || null;
      }

      if (isEditing) {
        await axios.put(`/api/products/${product.id}`, payload, getAuthHeaders());
        toast.success('Product updated successfully!');
      } else {
        await axios.post('/api/products', payload, getAuthHeaders());
        toast.success('Product created successfully!');
      }

      onSaved();
      onClose();
    } catch (err) {
      if (!imageFile || !uploading) {
        toast.error(err.response?.data?.message || 'Failed to save product.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 transition-all duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 px-7 py-6 bg-white/95 backdrop-blur-sm sticky top-0 z-20">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* ═══ IMAGE SECTION ═══ */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Product Image</label>

            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100/80 p-1 mb-4 border border-slate-200/50">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
                  imageMode === 'upload' ? 'bg-white text-primary-dark shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload New
              </button>
              <button
                type="button"
                onClick={() => setImageMode('library')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
                  imageMode === 'library' ? 'bg-white text-primary-dark shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose from Library
              </button>
            </div>

            {/* Mode: Upload New */}
            {imageMode === 'upload' && (
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="h-20 w-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 px-4 py-5 cursor-pointer hover:border-primary hover:bg-primary/10 transition group">
                  <svg className="w-5 h-5 text-primary-light group-hover:text-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-primary-dark font-bold">{imageFile ? imageFile.name : 'Choose image...'}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            )}

            {/* Mode: Media Library */}
            {imageMode === 'library' && (
              <div>
                {galleryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="ml-2 text-sm text-slate-500 font-medium">Loading library...</span>
                  </div>
                ) : gallery.length === 0 ? (
                  <div className="py-8 text-center rounded-lg border-2 border-dashed border-slate-200">
                    <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-400 font-medium">No images in your library yet.</p>
                    <p className="text-xs text-gray-300 mt-1">Upload your first image to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2 bg-slate-50">
                    {gallery.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectFromGallery(url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition hover:shadow-sm ${
                          form.image_url === url
                            ? 'border-primary ring-2 ring-indigo-200 shadow-sm'
                            : 'border-transparent hover:border-indigo-300'
                        }`}
                      >
                        <img src={url} alt={`Library ${idx + 1}`} className="h-full w-full object-cover" />
                        {form.image_url === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview of selected library image */}
                {imagePreview && form.image_url && !imageFile && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 border border-indigo-100 px-3 py-2">
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={imagePreview} alt="Selected" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs text-primary-dark font-semibold truncate flex-1">Image selected from library</span>
                    <button
                      type="button"
                      onClick={() => { setForm(prev => ({ ...prev, image_url: '' })); setImagePreview(''); }}
                      className="text-indigo-400 hover:text-primary"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cotton Polo Shirt"
              className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>

          {/* Price + Stock row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price (₹) *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="499.00"
                className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Stock</label>
              <input
                type="number" min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="100"
                className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Category + Size row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Shirt, Trouser, Belt..."
                className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Size</label>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Select size</option>
                {['XS','S','M','L','XL','XXL','Free Size'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Grade + Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Grade Group</label>
              <select
                value={form.grade_group}
                onChange={(e) => setForm({ ...form, grade_group: e.target.value })}
                className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">All Grades</option>
                <option value="foundation">Foundation</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              >
                <option value="unisex">Unisex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Discount %</label>
            <input
              type="number" min="0" max="100"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {/* School selection */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target School</label>
            <select
              value={form.school_id}
              onChange={(e) => setForm({ ...form, school_id: e.target.value })}
              className="w-full rounded-lg border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-medium outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            >
              <option value="">No School (Private Inventory)</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-black tracking-wide text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark hover:-translate-y-0.5 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? 'Uploading image...' : saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/60 bg-white/50 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-white hover:border-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
