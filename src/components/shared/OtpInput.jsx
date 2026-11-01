import { useRef } from 'react';

export default function OtpInput({ value, onChange, disabled = false, inputRef, invalid = false }) {
  const inputs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index]?.trim() || '');
  const focus = index => { inputs.current[index]?.focus(); inputs.current[index]?.select(); };
  const write = (index, text) => {
    const next = [...digits];
    const incoming = text.replace(/\D/g, '').slice(0, 6);
    const start = incoming.length === 6 ? 0 : index;
    if (!incoming) next[index] = '';
    else [...incoming].forEach((digit, offset) => { if (start + offset < 6) next[start + offset] = digit; });
    onChange(next.map(digit => digit || ' ').join(''));
    focus(incoming.length ? Math.min(5, start + incoming.length) : index);
  };
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="text-sm font-semibold">Mã xác thực OTP</legend>
    <div className="grid grid-cols-6 gap-2 sm:gap-3">
      {digits.map((digit, index) => <input
        key={index}
        ref={node => { inputs.current[index] = node; if (index === 0 && inputRef) inputRef.current = node; }}
        aria-label={`Chữ số OTP ${index + 1} trên 6`}
        aria-invalid={invalid || undefined}
        type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'}
        maxLength={6} required pattern="[0-9]" value={digit}
        className={`otp-digit ${digit ? 'is-filled' : ''}`}
        onFocus={event => event.target.select()}
        onChange={event => write(index, event.target.value)}
        onPaste={event => { event.preventDefault(); const text = event.clipboardData.getData('text'); if (/\d/.test(text)) write(index, text); }}
        onKeyDown={event => {
          if (event.key === 'Backspace') {
            event.preventDefault(); const target = !digit && index > 0 ? index - 1 : index;
            const next = [...digits]; next[target] = ''; onChange(next.map(item => item || ' ').join('')); focus(target);
          } else if (event.key === 'Delete') {
            event.preventDefault(); const next = [...digits]; next[index] = ''; onChange(next.map(item => item || ' ').join(''));
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); focus(Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1))));
          } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); focus(event.key === 'Home' ? 0 : 5); }
        }}
      />)}
    </div>
    <p className="text-xs text-muted-foreground">Bạn có thể dán cả mã 6 số vào một ô.</p>
  </fieldset>;
}
