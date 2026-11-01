import ModalLayer from './ModalLayer';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Package, MessageSquare, Star, X, CheckCheck } from 'lucide-react';
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

  const fetchSequence = useRef(0);
  const knownIds = useRef(new Set());
  const readingIds = useRef(new Set());
  const markingAll = useRef(false);
  const openRef = useRef(false);
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const request = ++fetchSequence.current;
    try {
      const res = await notificationApi.getAll();
      if (res && res.success && request === fetchSequence.current) {
        setNotifications(res.data);
        setAssignedOrderPopup(current => current && !res.data.some(item => String(item.notification_id) === String(current.notification_id) && Number(item.is_read) === 0) ? null : current);
        setUnreadCount(res.unreadCount);
        for (const item of res.data) knownIds.current.add(String(item.notification_id));
        // Check for unread assigned orders
        const unreadAssigned = res.data.find(n => n.notif_type === 'ORDER_ASSIGNED' && Number(n.is_read) === 0);
        if (!openRef.current && role === 'staff' && unreadAssigned && !sessionStorage.getItem(`shown_assign_${user.id}_${unreadAssigned.notification_id}`)) {
           sessionStorage.setItem(`shown_assign_${user.id}_${unreadAssigned.notification_id}`, 'true');
           setAssignedOrderPopup(unreadAssigned);
        }
        return res;
      }
    } catch  {
      // Silently fail if not authenticated
    }
  }, [user?.id, role]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds for new notifications as fallback
    const interval = setInterval(fetchNotifications, 15000);
    window.addEventListener('chat-read', fetchNotifications);
    return () => { fetchSequence.current += 1; clearInterval(interval); window.removeEventListener('chat-read', fetchNotifications); };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    
    const socket = io(import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000', { auth: { token: localStorage.getItem('token') } });
    
    socket.on('connect', () => {
      // Dùng user_id hoặc account_id tùy theo user object
      const id = user.customer_id || user.account_id || user.user_id || user.id;
      if (id) {
        socket.emit('join_room', id);
      }
    });

    socket.on('chat_read', () => { void fetchNotifications(); });
    socket.on('new_notification', (data) => {
      if (knownIds.current.has(String(data.notification_id))) return;
      knownIds.current.add(String(data.notification_id));
      void fetchNotifications();
      
      if (!openRef.current && role === 'staff' && data.notif_type === 'ORDER_ASSIGNED') {
          setAssignedOrderPopup(data);
          sessionStorage.setItem(`shown_assign_${user.id}_${data.notification_id}`, 'true');
      } else {
          toast(data.content, {
            icon: <Bell className="w-4 h-4" />
          });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, role, fetchNotifications]);

  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    if (readingIds.current.has(id)) return;
    readingIds.current.add(id);
    try {
      fetchSequence.current += 1;
      await notificationApi.markAsRead(id);
      fetchSequence.current += 1;
      setNotifications(prev => prev.map(n => String(n.notification_id) === String(id) ? { ...n, is_read: 1 } : n));
      setUnreadCount(count => Math.max(0, count - 1));
      setAssignedOrderPopup(current => String(current?.notification_id) === String(id) ? null : current);
      void fetchNotifications();
    } catch (error) {
      toast.error('Chưa lưu được trạng thái đã đọc. Vui lòng thử lại.');
    } finally { readingIds.current.delete(id); }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation();
    if (markingAll.current) return;
    markingAll.current = true;
    try {
      const snapshot = await fetchNotifications();
      if (!snapshot?.success) return;
      const cutoff = Math.max(0, ...snapshot.data.map(n => Number(n.notification_id)));
      if (!cutoff || !Number(snapshot.unreadCount)) return;
      fetchSequence.current += 1;
      await notificationApi.markAllAsRead(cutoff);
      fetchSequence.current += 1;
      setNotifications(prev => prev.map(n => Number(n.notification_id) <= cutoff ? { ...n, is_read: 1 } : n));
      setAssignedOrderPopup(current => current && Number(current.notification_id) > cutoff ? current : null);
      setUnreadCount(0);
      await fetchNotifications();
    } catch {
      toast.error('Không lưu được trạng thái đã đọc. Vui lòng thử lại.');
    } finally { markingAll.current = false; }
  };

  const handleNotificationClick = async (notif) => {
    if (Number(notif.is_read) === 0) {
      try {
        await handleMarkAsRead(notif.notification_id, { stopPropagation() {} });
      } catch {}
    }

    setIsOpen(false);
    
    if (role !== 'customer' && /^\/(support|reviews)\?(conversation|review)=[1-9]\d*$/.test(notif.target_url || '')) {
      navigate(notif.target_url);
    } else if (notif.related_order_id) {
      if (role === 'customer' && notif.order_code) navigate(`/store/tracking?code=${encodeURIComponent(notif.order_code)}`);
      else if (role !== 'customer') navigate(`/orders?search=${encodeURIComponent(notif.order_code || '')}`);
    }

  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        aria-label={"Th\u00f4ng b\u00e1o"}
        aria-expanded={isOpen}
        onClick={() => { const opening = !isOpen; openRef.current = opening; setIsOpen(opening); if (opening) { setAssignedOrderPopup(null); void handleMarkAllAsRead(); } }}
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
          <ModalLayer onClose={() => setIsOpen(false)} label="Thông báo">
          <div className="fixed inset-0 z-[70]">
          <button type="button" tabIndex={-1} aria-label="Đóng thông báo" onClick={() => setIsOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="dialog" aria-modal="true" aria-label="Lịch sử thông báo"
            className="absolute top-20 right-3 sm:right-6 w-[420px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-6rem)] bg-background border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-border flex justify-between items-start gap-3 bg-muted/30 shrink-0">
              <div><h3 className="text-lg font-bold text-foreground">Thông báo</h3><p className="text-xs text-muted-foreground mt-1">Đơn hàng, tin nhắn và cập nhật từ shop</p></div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng thông báo" className="grid place-items-center size-8 shrink-0 rounded-full hover:bg-muted"><X size={18} /></button>
            </div>
            <div className="px-5 py-2.5 flex items-center justify-between gap-3 border-b border-border text-xs shrink-0">
              <span className="text-muted-foreground">{unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Bạn đã xem các thông báo hiện tại'}</span>
              {unreadCount > 0 ? (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Check size={14} />
                  Đọc tất cả
                </button>
              ) : <CheckCheck size={16} className="text-emerald-600 shrink-0" />}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Chưa có thông báo nào</p><p className="text-xs mt-2">Các cập nhật mới sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.notification_id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); void handleNotificationClick(notif); } }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-5 py-4 hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none transition-colors cursor-pointer flex gap-3 relative ${Number(notif.is_read) === 0 ? 'bg-red-500/5' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center ${Number(notif.is_read) === 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
                        {notif.notif_type.includes('CHAT') ? <MessageSquare size={18} /> : notif.notif_type.includes('REVIEW') ? <Star size={18} /> : notif.related_order_id ? <Package size={18} /> : <Bell size={18} />}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-sm leading-relaxed break-words ${Number(notif.is_read) === 0 ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                          {notif.content}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{Number(notif.is_read) === 0 ? 'Chưa đọc' : 'Đã đọc'}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      {Number(notif.is_read) === 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                          <button aria-label="Đánh dấu đã đọc" onClick={event => handleMarkAsRead(notif.notification_id, event)} className="p-1 text-primary hover:bg-primary/10 rounded-full"><Check size={16} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-border bg-muted/30 text-center shrink-0">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                Hiển thị tối đa 50 thông báo gần nhất · Đóng
              </button>
            </div>
          </motion.div>
          </div>
          </ModalLayer>
        )}
      </AnimatePresence>
      {/* ASSIGNED ORDER POPUP */}
      <AnimatePresence>
        {assignedOrderPopup && (
          <ModalLayer onClose={() => setAssignedOrderPopup(null)} label="Thông báo đơn hàng"><div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
                Mã đơn: <strong className="text-foreground">{assignedOrderPopup.order_code || assignedOrderPopup.related_order_id || 'N/A'}</strong>
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
                      void handleNotificationClick(assignedOrderPopup);
                  }}
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Xử lý ngay
                </button>
              </div>
            </motion.div>
          </div></ModalLayer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
