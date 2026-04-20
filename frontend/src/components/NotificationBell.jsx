import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchNotifications = async () => {
      if (!token) {
        setNotifications([]);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    setIsOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-white shadow-sm">
             {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 glass-card shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="px-5 py-4 bg-white/50 border-b border-white/50 backdrop-blur-md flex justify-between items-center">
            <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400">Alerts</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto bg-white/30 backdrop-blur-sm">
            {loading ? (
              <LoadingSpinner label="Loading alerts..." className="py-6" />
            ) : notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-sm text-slate-600 font-bold tracking-tight">You're all caught up!</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">No new alerts</div>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-5 border-b border-white/40 hover:bg-white/60 transition duration-300 cursor-pointer">
                  <div className="flex gap-4">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition ${!notif.is_read ? 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-slate-300'}`} />
                    <div className="flex-1">
                      <p className={`text-sm tracking-tight leading-snug ${!notif.is_read ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                        {new Date(notif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
