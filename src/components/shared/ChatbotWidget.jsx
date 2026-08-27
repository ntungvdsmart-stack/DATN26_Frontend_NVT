import React, { useState } from 'react';
import { MessageSquare, X, Send, Phone, BotMessageSquare, Headset, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Chào bạn, FashionOS có thể giúp gì cho bạn hôm nay?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const [chatType, setChatType] = useState('bot'); // 'bot' or 'agent'

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    setTimeout(() => {
      if (chatType === 'bot') {
        setMessages(prev => [...prev, { text: 'Cảm ơn bạn! Nhân viên sẽ phản hồi trong giây lát.', sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { text: 'Chào bạn, mình là nhân viên tư vấn. Mình có thể giúp gì cho bạn?', sender: 'bot' }]);
      }
    }, 1000);
  };

  const toggleMenu = () => {
    if (chatOpen) {
      setChatOpen(false);
      setIsOpen(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const ZaloIcon = () => (
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" 
      alt="Zalo" 
      className="w-full h-full rounded-full shadow-sm object-cover"
    />
  );

  const BotIcon = ({ size }) => (
    <div className="relative flex items-center justify-center text-white">
      <BotMessageSquare size={size} />
      <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-300" />
    </div>
  );

  const openChat = (type) => {
    setChatType(type);
    setMessages([
      { 
        text: type === 'bot' 
          ? 'Chào bạn, FashionOS Bot có thể giúp gì cho bạn hôm nay?' 
          : 'Xin chào! Tư vấn viên của FashionOS đang trực tuyến. Bạn cần hỗ trợ gì ạ?', 
        sender: 'bot' 
      }
    ]);
    setChatOpen(true);
    setIsOpen(false);
  };

  const actionButtons = [
    { icon: Phone, color: 'bg-green-500 text-white', delay: 0.1, label: 'Hotline: 1900 1234', action: () => window.location.href = 'tel:19001234' },
    { icon: ZaloIcon, color: 'bg-transparent', delay: 0.2, label: 'Chat Zalo', action: () => window.open('https://zalo.me', '_blank') },
    { icon: BotIcon, color: 'bg-purple-500 text-white', delay: 0.3, label: 'Chat với Bot (AI)', action: () => openChat('bot') },
    { icon: Headset, color: 'bg-primary text-primary-foreground', delay: 0.4, label: 'Chat Tư vấn viên', action: () => openChat('agent') }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Mini Chat Window */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="mb-4 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-foreground text-background p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-background text-foreground rounded-full">
                  {chatType === 'bot' ? <BotMessageSquare size={16} /> : <Headset size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {chatType === 'bot' ? 'FashionOS Bot' : 'Tư vấn viên FashionOS'}
                  </h3>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {chatType === 'bot' ? 'Trả lời tự động' : 'Đang trực tuyến'}
                  </p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[80%] p-3 rounded-2xl text-sm',
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card border border-border rounded-tl-sm'
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
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
      <motion.button
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
          <span className="absolute inset-0 rounded-full bg-foreground opacity-50 animate-ping" style={{ animationDuration: '3s' }} />
        )}
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;
