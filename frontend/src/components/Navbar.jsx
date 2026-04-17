import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

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
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-700'
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
              className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"
              onClick={closeMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.29 2.29A1 1 0 005.41 17H17m0 0a2 2 0 100 4 2 2 0 000-4Zm-8 2a2 2 0 11-4 0 2 2 0 014 0Z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
              {user ? (
                <>
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-semibold text-slate-800">Hi, {user.name || user.email}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user.role || 'customer'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-700">
                    Login
                  </Link>
                  <Link to="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                    Register
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
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
                  <button onClick={handleLogout} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700">
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/login" onClick={closeMenu} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                      Login
                    </Link>
                    <Link to="/register" onClick={closeMenu} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white">
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
