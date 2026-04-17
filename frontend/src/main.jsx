import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Set backend URL for all axios requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Route Mapping: Express → API Gateway (Lambda) ───────
// The frontend was built for Express routes (/api/...).
// This interceptor transparently rewrites them for the
// serverless API Gateway endpoints when VITE_API_URL is set.
if (import.meta.env.VITE_API_URL) {
  axios.interceptors.request.use((config) => {
    let url = config.url || '';

    // Ordered from most-specific to least-specific
    const ROUTE_MAP = [
      ['/api/products/seller',           '/products'],
      ['/api/products/schools',          '/schools'],
      ['/api/products/images/gallery',   '/products/images'],
      ['/api/analytics/top-products',    '/admin/top-products'],
      ['/api/payment/create-order',      '/orders/checkout'],
      ['/api/catalog',                   '/shop/catalog'],
      ['/api/auth/',                     '/auth/'],
      ['/api/schools/',                  '/schools/'],
      ['/api/schools',                   '/schools'],
      ['/api/products/',                 '/products/'],
      ['/api/products',                  '/products'],
      ['/api/cart/',                     '/cart/'],
      ['/api/cart',                      '/cart'],
      ['/api/orders/',                   '/orders/'],
      ['/api/orders',                    '/orders'],
      ['/api/admin/',                    '/admin/'],
      ['/api/notifications',            '/notifications'],
      ['/api/recommendations',          '/recommendations'],
      ['/api/reviews/',                  '/reviews/'],
      ['/api/reviews',                   '/reviews'],
      ['/api/bundles/',                  '/shop/catalog?school_id='],  // graceful fallback
    ];

    for (const [from, to] of ROUTE_MAP) {
      if (url.startsWith(from)) {
        config.url = url.replace(from, to);
        break;
      }
    }

    return config;
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

