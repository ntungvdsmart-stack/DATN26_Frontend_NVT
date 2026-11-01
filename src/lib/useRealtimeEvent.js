import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useRealtimeEvent(eventName, handler, enabled = true) {
  const { user } = useAuth();
  const current = useRef(handler);
  useEffect(() => { current.current = handler; }, [handler]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!enabled || !user?.id || !token) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000', { auth: { token } });
    socket.on('connect', () => socket.emit('join_room'));
    socket.on(eventName, payload => current.current(payload));
    return () => socket.disconnect();
  }, [enabled, eventName, user?.id]);
}
