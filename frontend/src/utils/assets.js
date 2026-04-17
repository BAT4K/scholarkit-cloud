export const getPlaceholderImage = (label = 'ScholarKit', type = 'product') => {
  const palette = type === 'school' ? 'dbeafe/1e3a8a' : 'e2e8f0/334155';
  return `https://placehold.co/600x400/${palette}?text=${encodeURIComponent(label)}`;
};

// Map school names to their local images in /public/schools/
const SCHOOL_IMAGES = {
  'shiv nadar school':     '/schools/shiv-nadar.webp',
  'the knowledge habitat': '/schools/knowledge.svg',
  'amity international':   '/schools/amity.png',
};

export const resolveImageUrl = (imageUrl, label, type = 'product') => {
  // For schools, check the local image map first
  if (type === 'school' && label) {
    const mapped = SCHOOL_IMAGES[label.toLowerCase()];
    if (mapped) return mapped;
  }

  if (!imageUrl) {
    return getPlaceholderImage(label, type);
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
    return imageUrl;
  }

  return `/${imageUrl}`;
};

export const attachFallback = (event, label, type = 'product') => {
  event.currentTarget.src = getPlaceholderImage(label, type);
};
