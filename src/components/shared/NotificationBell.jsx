import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import notificationApi from '../../api/notificationApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = ({ isDark = false, role = 'customer' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [assignedOrderPopup, setAssignedOrderPopup] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      if (res && res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
        // Check for unread assigned orders
        const unreadAssigned = res.data.find(n => n.notif_type === 'ORDER_ASSIGNED' && n.is_read === 0);
        if (unreadAssigned && !sessionStorage.getItem(`shown_assign_${unreadAssigned.notification_id}`)) {
           setAssignedOrderPopup(unreadAssigned);
           sessionStorage.setItem(`shown_assign_${unreadAssigned.notification_id}`, 'true');
        }
      }
    } catch (error) {
      // Silently fail if not authenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications as fallback
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
    socket.on('connect', () => {
      // Dùng user_id hoặc account_id tùy theo user object
      const id = user.account_id || user.user_id || user.id;
      if (id) {
        socket.emit('join_room', id);
      }
    });

    socket.on('new_notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (data.notif_type === 'ORDER_ASSIGNED') {
          setAssignedOrderPopup(data);
          sessionStorage.setItem(`shown_assign_${data.notification_id}`, 'true');
      } else {
          toast(data.content, {
            icon: <Bell className="w-4 h-4" />
          });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationApi.markAsRead(notif.notification_id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n));
      } catch (error) {}
    }
    
    setIsOpen(false);
    
    if (notif.related_order_id) {
      if (role === 'customer') {
        navigate('/store/tracking');
      } else {
        navigate('/orders');
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-foreground'} ${unreadCount > 0 ? 'animate-shake' : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-foreground">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Check size={14} />
                  Đánh dấu đã đọc tất cả
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Bạn chưa có thông báo nào.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.notification_id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 relative ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${!notif.is_read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {notif.notif_type === 'order_status' ? <Package size={18} /> : <Bell size={18} />}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-sm ${!notif.is_read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          {notif.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      {!notif.is_read && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-border bg-muted/30 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ASSIGNED ORDER POPUP */}
      <AnimatePresence>
        {assignedOrderPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 50 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative w-full max-w-md bg-background border-2 border-primary rounded-3xl shadow-2xl p-8 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
              
              <div className="w-20 h-20 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 animate-shake">
                  <Package size={40} />
              </div>
              
              <h2 className="text-2xl font-black mb-2 text-foreground uppercase tracking-tight">Đơn hàng mới!</h2>
              <p className="text-muted-foreground mb-8 text-sm">
                Bạn vừa được phân công một đơn đặt hàng cần xử lý ngay.<br/>
                Mã đơn: <strong className="text-foreground">{assignedOrderPopup.related_order_id || 'N/A'}</strong>
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setAssignedOrderPopup(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold border border-border hover:bg-muted transition-colors"
                >
                  Đóng
                </button>
                <button 
                  onClick={() => {
                      setAssignedOrderPopup(null);
                      navigate('/orders');
                  }}
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Xử lý ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
