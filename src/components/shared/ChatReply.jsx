import { useEffect, useLayoutEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function TypingDots() {
  return <span role="status" aria-label="AI đang trả lời" className="inline-flex items-center gap-1.5 py-2"><span className="chat-typing-dot" /><span className="chat-typing-dot" /><span className="chat-typing-dot" /></span>;
}

export default function ChatReply({ text, animate = false, onProgress }) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(animate ? 0 : text.length);
  useLayoutEffect(() => { onProgress?.(); }, [visible, onProgress]);
  useEffect(() => {
    if (!animate || reducedMotion) return;
    let count = 0;
    const chunk = Math.max(1, Math.ceil(text.length / 60));
    const timer = setInterval(() => {
      count = Math.min(text.length, count + chunk);
      setVisible(count);
      if (count >= text.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [text, animate, onProgress, reducedMotion]);
  return <><span className="sr-only">{text}</span><span aria-hidden="true">{animate && !reducedMotion ? text.slice(0, visible) : text}{animate && !reducedMotion && visible < text.length && <span className="chat-reply-caret" />}</span></>;
}
