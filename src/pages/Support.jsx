import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, Image as ImageIcon, Paperclip, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { dummyCustomers } from '../utils/dummyData';

const initialChats = [
  { id: 'chat1', customerId: 'C001', lastMsg: 'Sản phẩm này còn size M không shop?', time: '10:45', unread: 2, online: true },
  { id: 'chat2', customerId: 'C005', lastMsg: 'Mình đã nhận được hàng, rất đẹp!', time: 'Hôm qua', unread: 0, online: false },
  { id: 'chat3', customerId: 'C012', lastMsg: 'Cho mình xin bảng size nhé.', time: 'Hôm qua', unread: 0, online: true },
  { id: 'chat4', customerId: 'C008', lastMsg: 'Đơn hàng của mình bao giờ giao tới?', time: 'T2', unread: 0, online: false },
];

const mockMessages = [
  { id: 1, sender: 'customer', text: 'Chào shop, mình muốn hỏi về Áo Thun Cotton Cổ Tròn.', time: '10:40' },
  { id: 2, sender: 'customer', text: 'Sản phẩm này còn size M màu trắng không shop?', time: '10:41' },
  { id: 3, sender: 'bot', text: 'Chào bạn! Hiện tại Áo Thun Cotton Cổ Tròn màu Trắng size M vẫn còn hàng nhé. Bạn có muốn đặt luôn không ạ?', time: '10:41' },
  { id: 4, sender: 'customer', text: 'Dạ, cho mình 1 cái.', time: '10:45' },
];

const Support = () => {
  const [activeChat, setActiveChat] = useState(initialChats[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');

  const activeCustomer = dummyCustomers.find(c => c.id === activeChat.customerId) || dummyCustomers[0];

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'staff', text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-100px)] -m-8 flex overflow-hidden bg-background">
      {/* Sidebar: Chat List */}
      <div className="w-[320px] flex-shrink-0 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg mb-3">Hỗ trợ khách hàng</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {initialChats.map(chat => {
            const cus = dummyCustomers.find(c => c.id === chat.customerId);
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  'w-full text-left p-4 border-b border-border/50 flex items-start gap-3 hover:bg-muted/50 transition-colors',
                  activeChat.id === chat.id && 'bg-muted'
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/80 flex items-center justify-center text-foreground font-bold">
                    {cus?.name.charAt(0)}
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm truncate">{cus?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center font-bold">
              {activeCustomer.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm">{activeCustomer.name}</h3>
              <p className="text-xs text-emerald-500 font-semibold">{activeChat.online ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"><Phone size={18} /></button>
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"><Video size={18} /></button>
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"><Info size={18} /></button>
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {messages.map((msg, idx) => {
                const isCustomer = msg.sender === 'customer';
                const isBot = msg.sender === 'bot';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex flex-col max-w-[70%]', isCustomer ? 'self-start' : 'self-end items-end')}
                  >
                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm',
                        isCustomer ? 'bg-card border border-border text-foreground rounded-tl-sm' :
                        isBot ? 'bg-primary/20 text-foreground border border-primary/30 rounded-tr-sm' :
                        'bg-primary text-primary-foreground rounded-tr-sm'
                      )}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {isBot && <span className="text-[10px] font-bold text-primary">BOT</span>}
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button type="button" className="p-2.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"><Paperclip size={18} /></button>
            <button type="button" className="p-2.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"><ImageIcon size={18} /></button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Customer Info */}
      <div className="w-[280px] hidden xl:flex flex-col border-l border-border bg-card">
        <div className="p-6 text-center border-b border-border">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center font-black text-3xl mb-4">
            {activeCustomer.name.charAt(0)}
          </div>
          <h3 className="font-bold">{activeCustomer.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{activeCustomer.email}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold rounded-full">
            Hạng {activeCustomer.rank}
          </span>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Số điện thoại</p>
            <p className="text-sm font-medium">{activeCustomer.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tổng chi tiêu</p>
            <p className="text-sm font-bold text-primary">{(activeCustomer.totalSpent).toLocaleString('vi-VN')}đ</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Số đơn hàng</p>
            <p className="text-sm font-medium">{activeCustomer.orders} đơn</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ngày tham gia</p>
            <p className="text-sm font-medium">{activeCustomer.joined}</p>
          </div>
          
          <div className="pt-4 border-t border-border">
            <button className="w-full py-2 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors">
              Xem chi tiết khách hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
