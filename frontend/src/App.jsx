import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import { Toaster } from 'react-hot-toast';

// Import Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SellerRoute from './components/SellerRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import OrderSuccess from './pages/OrderSuccess';
import SelectSchool from './pages/SelectSchool';
import Orders from './pages/Orders';
import SellerDashboard from './pages/SellerDashboard';
import LandingPage from './pages/LandingPage';
import OrderDetails from './pages/OrderDetails';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: '#0f172a',
                  boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.08)',
                  borderRadius: '100px',
                  fontWeight: '700',
                  fontSize: '14px',
                  padding: '12px 24px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f43f5e',
                    secondary: 'white',
                  },
                },
              }}
            />
            <Navbar />

            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/select-school" element={<SelectSchool />} />
              <Route path="/schools" element={<SelectSchool />} />
              <Route path="/login" element={<Login mode="login" />} />
              <Route path="/register" element={<Login mode="register" />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
