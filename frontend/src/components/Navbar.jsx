import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { ShoppingCart, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showAdmin = user?.role === 'admin';
  const showSeller = user?.role === 'seller' || user?.role === 'admin';

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ active } = {}) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? 'bg-slate-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-primary-dark'
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" onClick={closeMenu}>
              <Logo />
            </Link>
            {!isAuthPage && (
              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/select-school" className={navLinkClass({ active: location.pathname === '/select-school' || location.pathname === '/schools' })}>
                  Schools
                </Link>
                <Link to="/shop" className={navLinkClass({ active: location.pathname === '/shop' })}>
                  Shop
                </Link>
                {user ? (
                  <Link to="/orders" className={navLinkClass({ active: location.pathname.startsWith('/orders') })}>
                    My Orders
                  </Link>
                ) : null}
                {showAdmin ? (
                  <Link to="/admin" className={navLinkClass({ active: location.pathname === '/admin' })}>
                    Admin
                  </Link>
                ) : null}
                {showSeller ? (
                  <Link to="/seller" className={navLinkClass({ active: location.pathname === '/seller' })}>
                    Inventory
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (showAdmin || showSeller) ? <NotificationBell /> : null}

            <Link
              to={user ? '/cart' : '/login'}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-primary-dark"
              onClick={closeMenu}
            >
              <ShoppingCart className="h-6 w-6 stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
              {user ? (
                <>
                  <div className="hidden text-right md:block shrink-0 min-w-max">
                    <p className="text-sm font-semibold text-slate-800">Hi, {user.name || user.email}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user.role || 'customer'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary px-4 py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-slate-600 transition hover:text-primary-dark mr-2">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary px-4 py-2">
                    Register
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X className="h-6 w-6 stroke-[1.5]" /> : <Menu className="h-6 w-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {menuOpen && !isAuthPage ? (
          <div className="border-t border-slate-200 py-4 lg:hidden">
            <div className="flex flex-col gap-2">
              <Link to="/select-school" className={navLinkClass({ active: location.pathname === '/select-school' || location.pathname === '/schools' })} onClick={closeMenu}>
                Schools
              </Link>
              <Link to="/shop" className={navLinkClass({ active: location.pathname === '/shop' })} onClick={closeMenu}>
                Shop
              </Link>
              {user ? (
                <Link to="/orders" className={navLinkClass({ active: location.pathname.startsWith('/orders') })} onClick={closeMenu}>
                  My Orders
                </Link>
              ) : null}
              {showAdmin ? (
                <Link to="/admin" className={navLinkClass({ active: location.pathname === '/admin' })} onClick={closeMenu}>
                  Admin
                </Link>
              ) : null}
              {showSeller ? (
                <Link to="/seller" className={navLinkClass({ active: location.pathname === '/seller' })} onClick={closeMenu}>
                  Inventory
                </Link>
              ) : null}
              <div className="mt-3 border-t border-slate-200 pt-3">
                {user ? (
                  <button onClick={handleLogout} className="btn-secondary w-full">
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <Link to="/login" onClick={closeMenu} className="btn-secondary flex-1">
                      Login
                    </Link>
                    <Link to="/register" onClick={closeMenu} className="btn-primary flex-1">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
