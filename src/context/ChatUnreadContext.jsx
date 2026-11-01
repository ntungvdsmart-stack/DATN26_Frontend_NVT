import { createContext,useContext,useCallback,useEffect,useRef,useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useRealtimeEvent } from '../lib/useRealtimeEvent';
import axiosClient from '../api/axiosClient';

const ChatUnreadContext=createContext({count:0,refresh:()=>{}});
export const useChatUnread=()=>useContext(ChatUnreadContext);
export function ChatUnreadProvider({children}){
 const {user,can}=useAuth();
 const enabled=['admin','staff'].includes(user?.role)&&can('support.manage');
 const [count,setCount]=useState(0);
 const sequence=useRef(0);
 const refresh=useCallback(async()=>{if(!enabled)return;const request=++sequence.current;try{const result=await axiosClient.get('/support/unread');if(request===sequence.current)setCount(Number(result.data.unread_count)||0);}catch{/* Retry on next event/poll. */}},[enabled,user?.id]);
 useRealtimeEvent('chat_message',refresh,enabled);
 useRealtimeEvent('chat_read',refresh,enabled);
 useEffect(()=>{if(!enabled)return;refresh();const timer=setInterval(refresh,15000);window.addEventListener('chat-read',refresh);return()=>{sequence.current+=1;clearInterval(timer);window.removeEventListener('chat-read',refresh);};},[enabled,refresh]);
 return <ChatUnreadContext.Provider value={{count:enabled?count:0,refresh}}>{children}</ChatUnreadContext.Provider>;
}
export function ChatUnreadLink(){
 const {can}=useAuth();const {count}=useChatUnread();
 if(!can('support.manage'))return null;
 return <Link to="/support" aria-label={count?`Chat: ${count} tin nhắn chưa đọc`:'Mở hộp thư chat'} title="Tin nhắn khách hàng" className="relative grid place-items-center w-10 h-10 border border-border rounded-full hover:bg-muted"><MessageSquare size={18}/>{count>0&&<span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full px-1 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background">{count>99?'99+':count}</span>}</Link>;
}
