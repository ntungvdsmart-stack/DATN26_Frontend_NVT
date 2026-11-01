import ChatReply, { TypingDots } from './ChatReply';
import Pagination from './Pagination';
import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { MessageSquare, X, Send, BotMessageSquare, Headset, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { useRealtimeEvent } from '../../lib/useRealtimeEvent';

const ChatbotWidget = () => {
  const { user, role } = useAuth();
  const customerId = role === 'customer' ? user?.id : null;
  const [historyLoading, setHistoryLoading] = useState(false);
  const guestHistory = useRef([]);
  const chatOwner = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Chào bạn, FashionOS có thể giúp gì cho bạn hôm nay?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const [chatType, setChatType] = useState('bot'); // 'bot' or 'agent'
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState({ totalPages: 1 });
  const currentView = useRef('');
  useLayoutEffect(() => { currentView.current = `${customerId || 'guest'}:${chatOpen}:${chatType}:${sessionId}:${historyPage}`; }, [customerId, chatOpen, chatType, sessionId, historyPage]);
  const requestId = useRef(0);
  const sendingRef = useRef(false);
  const messageList = useRef(null);
  const nearBottom = useRef(true);
  const scrollToLatest = useCallback(() => {
    const node = messageList.current;
    if (node && nearBottom.current) node.scrollTop = node.scrollHeight;
  }, []);
  useLayoutEffect(() => { scrollToLatest(); }, [messages, chatOpen, scrollToLatest]);
  const loadHistory = useCallback(async () => {
    if (!chatOpen || (chatType === 'agent' ? !sessionId : !customerId)) return;
    const view = `${customerId || 'guest'}:${chatOpen}:${chatType}:${sessionId}:${historyPage}`;
    const request = ++requestId.current;
    try {
      setHistoryLoading(true);
      const res = await axiosClient.get(chatType === 'agent' ? `/customer-chat/${sessionId}/messages` : '/support/gemini-history', { params: { page: historyPage } });
      if (view !== currentView.current || request !== requestId.current) return;
      setHistoryMeta(res.pagination);
      if (res.pagination.page !== historyPage) setHistoryPage(res.pagination.page);
      setMessages(previous => {
        const known = new Set(previous.map(message => message.id).filter(Boolean));
        const initial = known.size === 0;
        return res.data.map(message => ({ id: message.message_id, text: message.content, sender: message.sender_type === 'customer' ? 'user' : 'bot', animate: !initial && !known.has(message.message_id) && message.sender_type !== 'customer' }));
      });
    } catch { if (view === currentView.current && request === requestId.current) toast.error('Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c l\u1ecbch s\u1eed chat.'); }
    finally { if (view === currentView.current && request === requestId.current) setHistoryLoading(false); }
  }, [chatOpen, chatType, sessionId, historyPage, customerId]);
  useRealtimeEvent('chat_message', event => {
    if (String(event.conversation_id) === String(sessionId)) loadHistory();
  }, chatOpen && chatType === 'agent');
  useEffect(() => {
    loadHistory();
    if (!chatOpen || chatType !== 'agent' || !sessionId) return;
    const timer = setInterval(loadHistory, 4000);
    return () => { requestId.current += 1; clearInterval(timer); };
  }, [loadHistory, chatOpen, chatType, sessionId]);

  useEffect(() => {
    requestId.current += 1;
    chatOwner.current = null;
    setChatOpen(false); setSessionId(null); setMessages([]); setHistoryLoading(false);
  }, [customerId, role]);
  useEffect(() => {
    if (chatType === 'bot' && !customerId && chatOpen && chatOwner.current === 'guest') guestHistory.current = messages.filter(message => !message.isTyping).slice(-100);
  }, [messages, chatType, customerId, chatOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sendingRef.current || historyLoading) return;
    const view = currentView.current;
    const userMsg = input.trim();
    if (chatType === 'agent') {
      if (!sessionId) { toast.error('Vui lòng đăng nhập để chat với nhân viên'); return; }
      sendingRef.current = true; setSending(true);
      try {
        await axiosClient.post(`/customer-chat/${sessionId}/messages`, { content: userMsg });
        if (currentView.current !== view) return;
        setInput(''); setHistoryPage(1);
        requestId.current += 1;
        if (historyPage === 1) await loadHistory();
      } catch (error) { toast.error(error.message || 'Không gửi được tin nhắn'); }
      finally { sendingRef.current = false; setSending(false); }
      return;
    }
    
    sendingRef.current = true; setSending(true);
    // Thêm tin nhắn của user vào UI ngay lập tức
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');


    // Nếu là chat với Bot AI
    // Thêm placeholder "đang gõ..."
    setMessages(prev => [...prev, { text: '...', sender: 'bot', isTyping: true }]);

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/support/gemini-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
            body: JSON.stringify({ message: userMsg, history: messages.filter(message => !message.isTyping).slice(-10) }),
            signal: AbortSignal.timeout(35000)
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Không gửi được câu hỏi');
        
        // Cập nhật lại tin nhắn cuối cùng (xóa isTyping)
        if (currentView.current !== view) return;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { text: data.reply || 'Xin lỗi, tôi không thể trả lời lúc này.', sender: 'bot' };
            return newMessages;
        });
        if (customerId) {
          if (!data.history_saved) toast.error('Tin nh\u1eafn ch\u01b0a l\u01b0u \u0111\u01b0\u1ee3c. Vui l\u00f2ng ki\u1ec3m tra k\u1ebft n\u1ed1i.');
          else { setHistoryPage(1); if (historyPage === 1) await loadHistory(); }
        }
    } catch  {
        if (currentView.current !== view) return;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { text: 'Lỗi kết nối tới AI. Vui lòng thử lại sau.', sender: 'bot' };
            return newMessages;
        });
    } finally { sendingRef.current = false; setSending(false); }
  };

  const toggleMenu = () => {
    if (chatOpen) {
      setChatOpen(false);
      setIsOpen(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const BotIcon = ({ size }) => (
    <div className="relative flex items-center justify-center text-white">
      <BotMessageSquare size={size} />
      <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-300" />
    </div>
  );

  const openChat = async (type) => {
    if (sendingRef.current) return;
    requestId.current += 1;
    setHistoryPage(1); setHistoryMeta({ totalPages: 1 });
    if (type === 'agent') {
      try {
        const res = await axiosClient.post('/customer-chat');
        setSessionId(res.data.conversation_id);
      } catch (error) { toast.error(error.message || 'Vui lòng đăng nhập để chat với nhân viên'); return; }
    }
    setChatType(type);
    chatOwner.current = customerId || 'guest';
    setHistoryLoading(type === 'bot' && Boolean(customerId));
    setMessages(type === 'bot' && !customerId && guestHistory.current.length ? guestHistory.current : [
      { 
        text: type === 'bot' 
          ? 'Chào bạn, FashionOS Bot có thể giúp gì cho bạn hôm nay?' 
          : 'Bạn có thể gửi tin nhắn tại đây. Nhân viên sẽ phản hồi trong cuộc hội thoại này.', 
        sender: 'bot' 
      }
    ]);
    nearBottom.current = true;
    setInput('');
    setChatOpen(true);
    setIsOpen(false);
  };

  const actionButtons = [
    { icon: BotIcon, color: 'bg-purple-500 text-white', delay: 0.3, label: 'Chat với Bot (AI)', action: () => openChat('bot') },
    { icon: Headset, color: 'bg-primary text-primary-foreground', delay: 0.4, label: 'Chat Tư vấn viên', action: () => openChat('agent') }
  ];

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-1.5rem)]">
      
      {/* Mini Chat Window */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            role="region" aria-label={chatType === 'bot' ? 'Chat AI' : 'Chat Shop'}
            className="w-80 sm:w-96 max-w-full bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: 'calc(100dvh - 2rem)' }}
          >
            {/* Header */}
            <div className="bg-foreground text-background p-4 flex items-center justify-between shrink-0 relative z-10 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-background text-foreground rounded-full">
                  {chatType === 'bot' ? <BotMessageSquare size={16} /> : <Headset size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {chatType === 'bot' ? 'FashionOS AI' : 'Shop'}
                  </h3>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {chatType === 'bot' ? 'Trả lời tự động' : 'Hỗ trợ từ cửa hàng'}
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Đóng hội thoại" onClick={() => { setChatOpen(false); setIsOpen(false); }} className="chat-close grid place-items-center w-9 h-9 shrink-0 rounded-full border border-current/20 hover:bg-background/15 transition-colors">
                <X size={20} />
              </button>
            </div>

            {(chatType === 'agent' || customerId) && historyMeta.totalPages > 1 && <div className="px-2 pb-2"><p className="text-center text-xs text-muted-foreground mt-2">Trang 1 là tin nhắn mới nhất</p><Pagination page={historyPage} totalPages={historyMeta.totalPages} onChange={page => { requestId.current += 1; setMessages([]); setHistoryPage(page); }} label={chatType === 'bot' ? 'Lịch sử chat AI' : 'Lịch sử tin nhắn Shop'} /></div>}
            {historyLoading && <p role="status" className="px-4 py-2 text-xs text-muted-foreground">Đang tải lịch sử…</p>}
            {chatType === 'bot' && !customerId && <p className="px-4 py-2 text-[11px] text-muted-foreground">Đăng nhập để lưu lịch sử chat và xem lại trên thiết bị khác.</p>}
            {/* Messages */}
            <div ref={messageList} onScroll={event => { const node = event.currentTarget; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 70; }} role="log" aria-live="polite" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 bg-muted/20">
              {messages.map((msg, idx) => (
                <motion.div key={msg.id || `${chatType}-${idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} className={cn('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap break-words',
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card border border-border rounded-tl-sm'
                  )}>
                    {msg.sender !== 'user' && <span className="block text-[10px] font-bold text-muted-foreground mb-1">{chatType === 'bot' ? 'AI' : 'Shop'}</span>}
                    {msg.isTyping ? <TypingDots /> : msg.sender === 'user' ? msg.text : <ChatReply text={msg.text} animate={chatType === 'bot' ? idx > 0 : Boolean(msg.animate)} onProgress={scrollToLatest} />}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="shrink-0 p-3 border-t border-border bg-card flex gap-2">
              <input
                type="text"
                value={input}
                maxLength={chatType === 'agent' ? 4000 : 2000}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 min-w-0 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
              <button 
                type="submit"
                aria-label="Gửi tin nhắn"
                disabled={!input.trim() || sending || historyLoading}
                className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed Dial Buttons */}
      <AnimatePresence>
        {isOpen && !chatOpen && (
          <div className="flex flex-col gap-3 mb-4 items-end">
            {actionButtons.map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: btn.delay }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-card text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-border">
                    {btn.label}
                  </span>
                  <button 
                    onClick={btn.action}
                    className={cn('w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 p-0 overflow-hidden', btn.color)}
                  >
                    <Icon size={24} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      {!chatOpen && <motion.button
        aria-label={isOpen ? 'Đóng menu hỗ trợ' : 'Mở hỗ trợ'}
        aria-expanded={isOpen}
        onClick={toggleMenu}
        className="w-14 h-14 bg-foreground text-background rounded-full shadow-2xl flex items-center justify-center relative group"
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen || chatOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen || chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          </motion.div>
        </AnimatePresence>
        
        {/* Pulse effect when closed */}
        {!(isOpen || chatOpen) && (
          <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-foreground opacity-20 animate-ping" style={{ animationDuration: '3s' }} />
        )}
      </motion.button>}
    </div>
  );
};

export default ChatbotWidget;
