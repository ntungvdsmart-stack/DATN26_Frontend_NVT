import axiosClient from '../api/axiosClient';
import { useSearchParams } from 'react-router-dom';
import SupportInbox from '../components/admin/SupportInbox';
import useListPagination from '../lib/useListPagination';
import ModalLayer from '../components/shared/ModalLayer';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import supportApi from '../api/supportApi';
import { useRealtimeEvent } from '../lib/useRealtimeEvent';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Support = () => {
  const { role } = useAuth();
  const [queryParams] = useSearchParams();
  const requestedConversation = queryParams.get('conversation');
  const openedConversation = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const selectedSessionId = useRef(null);
  useLayoutEffect(() => { selectedSessionId.current = activeSession?.id; }, [activeSession?.id]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState({ totalPages: 1 });
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const messageRequest = useRef(0);
  const selectedHistoryPage = useRef(historyPage);
  useLayoutEffect(() => { selectedHistoryPage.current = historyPage; }, [historyPage]);
  const [search, setSearch] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');

  const fetchMessages = useCallback(async (sessionId) => {
    const request = ++messageRequest.current;
    try {
      const res = await supportApi.getMessages(sessionId, historyPage);
      if (res && res.success && request === messageRequest.current && selectedHistoryPage.current === historyPage && String(selectedSessionId.current) === String(sessionId)) {
        setMessagesError(''); setMessages(res.data); setHistoryMeta(res.pagination);
        if (res.pagination.page !== historyPage) setHistoryPage(res.pagination.page);
      }
    } catch {
      if (request === messageRequest.current && String(selectedSessionId.current) === String(sessionId)) setMessagesError('Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c tin nh\u1eafn.');
    } finally { if (request === messageRequest.current) setMessagesLoading(false); }
  }, [historyPage]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await supportApi.getSessions();
      if (res && res.success) {
        setSessions(res.data);
        if (activeSession && !res.data.some(session => String(session.id) === String(activeSession.id))) {
          selectedSessionId.current = null; messageRequest.current += 1; setActiveSession(null); setMessages([]); setHistoryPage(1); setHistoryMeta({ totalPages: 1 });
        }
        if (res.data.length > 0 && !activeSession) {
          setHistoryPage(1); setHistoryMeta({ totalPages: 1 }); setActiveSession(res.data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [activeSession]);

  useRealtimeEvent('chat_message', event => {
    fetchSessions();
    if (String(event.conversation_id) === String(activeSession?.id)) fetchMessages(activeSession.id);
  });

  // Assign Modal State
  const [assignModal, setAssignModal] = useState(false);
  const assigningSessionId = useRef(null);
  const [branchSuggestions, setBranchSuggestions] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignStep, setAssignStep] = useState(1);

  // Fetch list of sessions
  useEffect(() => {
    fetchSessions();
    const timer = setInterval(fetchSessions, 10000);

  

  return () => clearInterval(timer);
  }, [fetchSessions]);

  // Fetch messages when a session is selected
  useEffect(() => {
    setMessages([]); setMessagesError(''); setMessagesLoading(Boolean(activeSession));
    if (activeSession) {
      fetchMessages(activeSession.id);
      const timer = setInterval(() => fetchMessages(activeSession.id), 4000);
        return () => clearInterval(timer);
    }
  }, [activeSession, fetchMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || sendingRef.current) return;
    const sessionId = activeSession.id;
    sendingRef.current = true; setSending(true);
    try {
      const res = await supportApi.sendMessage(sessionId, { content: input.trim() });
      if (res && res.success && String(selectedSessionId.current) === String(sessionId)) {
        setInput(''); setHistoryPage(1);
        if (historyPage === 1) fetchMessages(activeSession.id);
        fetchSessions(); // Refresh list to show latest msg
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không gửi được tin nhắn');
    } finally { sendingRef.current = false; setSending(false); }
  };

  const handleOpenAssignModal = async () => {
    if (!activeSession || activeSession.staff_id || activeSession.ended_at) return;
    assigningSessionId.current = activeSession.id;
    setAssignModal(true);
    setBranchSuggestions([]);
    setSelectedBranchId('');
    setSelectedStaffId('');
    setAssignStep(1);
    try {
        const res = await supportApi.getBranchSuggestions(assigningSessionId.current);
        if(res && res.success) {
            setBranchSuggestions(res.data);
            if (res.data.length > 0) setSelectedBranchId(res.data[0].branch_id);
        }
    } catch {
        alert('Lỗi lấy danh sách gợi ý');
    }
  };

  const submitAssign = async () => {
    if (isAssigning) return;
    if(!selectedBranchId || !selectedStaffId) return alert('Vui lòng chọn chi nhánh và nhân viên');
    setIsAssigning(true);
    try {
        const res = await supportApi.assignSession(assigningSessionId.current, {
            staff_id: selectedStaffId, branch_id: selectedBranchId
        });
        if(res && res.success) {
            setAssignModal(false);
            alert('Chuyển đoạn chat thành công');
            fetchSessions();
        } else {
            alert(res.message);
        }
    } catch (error) {
        alert(error.response?.data?.message || 'Lỗi phân công');
        setAssignModal(false);
        fetchSessions();
    }
    setIsAssigning(false);
  };
  useEffect(() => {
    if (!requestedConversation || openedConversation.current === requestedConversation) return;
    const requested = sessions.find(item => String(item.id) === requestedConversation);
    if (requested) { openedConversation.current = requestedConversation; setActiveSession(requested); setHistoryPage(1); setInput(''); }
  }, [requestedConversation, sessions, activeSession?.id]);

  const readPending = useRef(new Set());
  const markConversationRead = useCallback(async (sessionId, messageId) => {
    const key = `${sessionId}:${messageId}`;
    if (readPending.current.has(key)) return false;
    readPending.current.add(key);
    try {
      const result = await axiosClient.post(`/support/sessions/${sessionId}/read`, { last_message_id: messageId });
      setSessions(previous => previous.map(item => String(item.id) === String(sessionId) ? { ...item, unread_count: result.data.unread_count } : item));
      window.dispatchEvent(new Event('chat-read'));
      return true;
    } catch { return false; } finally { readPending.current.delete(key); }
  }, []);

  const sessionPage = useListPagination(sessions.filter(chat => `${chat.customer_name || ''} ${chat.last_message || ''}`.toLowerCase().includes(search.toLowerCase())), search);

  return (
    <div>
      <SupportInbox onRead={markConversationRead} requestedConversation={requestedConversation} role={role} sessions={sessions} activeSession={activeSession} sessionPage={sessionPage}
        search={search} onSearch={setSearch} messages={messages} historyPage={historyPage} historyMeta={historyMeta}
        onHistoryPage={setHistoryPage} input={input} onInput={setInput} onSend={handleSend} sending={sending}
        onAssign={handleOpenAssignModal} loading={messagesLoading} error={messagesError}
        onRetry={() => { if (activeSession) { setMessagesLoading(true); fetchMessages(activeSession.id); } }}
        onSelect={chat => { if (String(chat.id) === String(selectedSessionId.current)) return; selectedSessionId.current = chat.id; messageRequest.current += 1; setHistoryPage(1); setHistoryMeta({ totalPages: 1 }); setMessages([]); setInput(''); setActiveSession(chat); }} />

      {/* Modal Phân công */}
      <AnimatePresence>
        {assignModal && (
          <ModalLayer onClose={() => setAssignModal(false)} label="Phân công hỗ trợ"><div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Phân công nhân viên hỗ trợ</h2>
              <div className="space-y-4">
                {assignStep === 1 ? (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-2">Bước 1: Chọn chi nhánh (Gợi ý theo khoảng cách với khách)</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {branchSuggestions.map(b => (
                        <div 
                          key={b.branch_id} 
                          onClick={() => { setSelectedBranchId(b.branch_id); setSelectedStaffId(''); }}
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
          </div></ModalLayer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;
