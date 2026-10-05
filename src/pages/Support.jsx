import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, Image as ImageIcon, Paperclip, MoreVertical, Phone, Video, Info, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import supportApi from '../api/supportApi';

const Support = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Assign Modal State
  const [assignModal, setAssignModal] = useState(false);
  const [branchSuggestions, setBranchSuggestions] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignStep, setAssignStep] = useState(1);

  // Fetch list of sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await supportApi.getSessions();
      if (res && res.success) {
        setSessions(res.data);
        if (res.data.length > 0 && !activeSession) {
          setActiveSession(res.data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch messages when a session is selected
  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    }
  }, [activeSession]);

  const fetchMessages = async (sessionId) => {
    try {
      const res = await supportApi.getMessages(sessionId);
      if (res && res.success) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeSession) return;
    try {
      const res = await supportApi.sendMessage(activeSession.id, { content: input });
      if (res && res.success) {
        setInput('');
        fetchMessages(activeSession.id);
        fetchSessions(); // Refresh list to show latest msg
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenAssignModal = async () => {
    if (!activeSession) return;
    setAssignModal(true);
    setBranchSuggestions([]);
    setSelectedBranchId('');
    setSelectedStaffId('');
    setAssignStep(1);
    try {
        const res = await supportApi.getBranchSuggestions(activeSession.id);
        if(res && res.success) {
            setBranchSuggestions(res.data);
            if (res.data.length > 0) setSelectedBranchId(res.data[0].branch_id);
        }
    } catch(err) {
        alert('Lỗi lấy danh sách gợi ý');
    }
  };

  const submitAssign = async () => {
    if(!selectedBranchId || !selectedStaffId) return alert('Vui lòng chọn chi nhánh và nhân viên');
    setIsAssigning(true);
    try {
        const res = await supportApi.assignSession(activeSession.id, {
            staff_id: selectedStaffId
        });
        if(res && res.success) {
            setAssignModal(false);
            alert('Chuyển đoạn chat thành công');
            fetchSessions();
        } else {
            alert(res.message);
        }
    } catch(err) {
        alert('Lỗi phân công');
    }
    setIsAssigning(false);
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
          {sessions.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveSession(chat)}
              className={cn(
                'w-full text-left p-4 border-b border-border/50 flex items-start gap-3 hover:bg-muted/50 transition-colors',
                activeSession?.id === chat.id && 'bg-muted'
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/80 flex items-center justify-center text-foreground font-bold">
                  {(chat.customer_name || 'K').charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm truncate">{chat.customer_name || 'Khách vãng lai'}</span>
                  <span className="text-[10px] text-muted-foreground">{chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{chat.last_message || 'Bắt đầu trò chuyện'}</p>
              </div>
            </button>
          ))}
          {sessions.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Không có tin nhắn nào</div>}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center font-bold">
              {(activeSession?.customer_name || 'K').charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm">{activeSession?.customer_name || 'Khách vãng lai'}</h3>
              <p className="text-xs text-emerald-500 font-semibold">{activeSession?.status === 'open' ? 'Đang mở' : 'Đã đóng'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleOpenAssignModal}
              className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-full transition-colors" 
              title="Chuyển chi nhánh"
            >
              <MapPin size={18} />
            </button>
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
              {messages.map((msg) => {
                const isCustomer = msg.sender_type === 'customer';
                const isBot = msg.sender_type === 'bot';
                return (
                  <motion.div
                    key={msg.message_id}
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
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {isBot && <span className="text-[10px] font-bold text-primary">BOT</span>}
                      <span className="text-[10px] text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
        {activeSession ? (
          <>
            <div className="p-6 text-center border-b border-border">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center font-black text-3xl mb-4">
                {(activeSession.customer_name || 'K').charAt(0)}
              </div>
              <h3 className="font-bold">{activeSession.customer_name || 'Khách vãng lai'}</h3>
              <p className="text-xs text-muted-foreground mt-1">{activeSession.customer_email || 'Chưa cập nhật'}</p>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mã phiên chat</p>
                <p className="text-sm font-medium">#{activeSession.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                <p className="text-sm font-bold text-primary">{activeSession.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ngày tạo</p>
                <p className="text-sm font-medium">{new Date(activeSession.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">Chọn một phiên chat để xem thông tin</div>
        )}
      </div>

      {/* Modal Phân công */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Chuyển chat cho chi nhánh khác</h2>
              <div className="space-y-4">
                {assignStep === 1 ? (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-2">Bước 1: Chọn chi nhánh (Gợi ý theo khoảng cách với khách)</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {branchSuggestions.map(b => (
                        <div 
                          key={b.branch_id} 
                          onClick={() => { setSelectedBranchId(b.branch_id); }}
                          className={cn("p-3 rounded-xl border cursor-pointer transition-all", 
                            selectedBranchId === b.branch_id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                          )}
                        >
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold">{b.branch_name}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">{b.address || 'Không có địa chỉ'}</p>
                              </div>
                              <div className="text-right">
                                  {b.distance !== null && <p className="text-xs font-semibold text-primary">{Number(b.distance).toFixed(1)} km</p>}
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-2">Bước 2: Chọn nhân viên trực</label>
                    <div className="p-3 bg-muted/30 rounded-xl mb-4 border border-border">
                        <p className="text-sm"><strong>Chi nhánh:</strong> {branchSuggestions.find(b => b.branch_id === selectedBranchId)?.branch_name}</p>
                    </div>
                    <select 
                      value={selectedStaffId} 
                      onChange={e => setSelectedStaffId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border bg-background outline-none"
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {(branchSuggestions.find(b => b.branch_id === selectedBranchId)?.staff || []).map(s => (
                        <option key={s.account_id} value={s.account_id}>{s.full_name} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                {assignStep === 1 ? (
                  <>
                    <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Hủy</button>
                    <button 
                      onClick={() => setAssignStep(2)} 
                      disabled={!selectedBranchId}
                      className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg disabled:opacity-50"
                    >
                      Tiếp tục
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setAssignStep(1)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Quay lại</button>
                    <button 
                      onClick={submitAssign} 
                      disabled={!selectedBranchId || !selectedStaffId || isAssigning}
                      className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg disabled:opacity-50"
                    >
                      {isAssigning ? 'Đang chuyển...' : 'Xác nhận chuyển'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;
