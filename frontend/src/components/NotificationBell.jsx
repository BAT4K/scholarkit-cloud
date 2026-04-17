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
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Alerts</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <LoadingSpinner label="Loading alerts..." className="py-6" />
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 font-medium">You're all caught up!</div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!notif.is_read ? 'bg-blue-50/30' : 'bg-white'}`}>
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 shadow-sm ${!notif.is_read ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    <div>
                      <p className={`text-sm tracking-tight ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[11px] font-medium text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
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
