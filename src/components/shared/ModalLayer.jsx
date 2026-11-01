import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const layers = [];
let originalOverflow = '';
let nextLayerZ = 10000;
const focusable = 'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

export default function ModalLayer({ children, onClose, label, drawer = false }) {
  const root = useRef(null);
  const focusBeforeMount = useRef(document.activeElement);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useLayoutEffect(() => {
    const node = root.current;
    const previousFocus = focusBeforeMount.current;
    if (!layers.length) { originalOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    layers.push(node);
    nextLayerZ += 10;
    node.style.zIndex = String(nextLayerZ);
    if (!node.contains(document.activeElement)) {
      const first = node.querySelector('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])') || node.querySelector(focusable) || node;
      first.focus({ preventScroll: true });
    }
    const onKey = event => {
      if (layers.at(-1) !== node) return;
      if (event.key === 'Escape' && event.target.getAttribute?.('role') === 'combobox' && event.target.getAttribute('aria-expanded') === 'true') return;
      if (event.key === 'Escape' && close.current) { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const elements = [...node.querySelectorAll(focusable)].filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
      if (!elements.length) { event.preventDefault(); node.focus(); return; }
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const index = layers.indexOf(node), wasTop = layers.at(-1) === node;
      if (index >= 0) layers.splice(index, 1);
      if (!layers.length) { document.body.style.overflow = originalOverflow; nextLayerZ = 10000; }
      if (wasTop) {
        const target = previousFocus?.isConnected && !previousFocus.disabled ? previousFocus : layers.at(-1)?.querySelector(focusable);
        target?.focus({ preventScroll: true });
      }
    };
  }, []);
  const validateRequired = event => {
    if (layers.at(-1) !== root.current) return;
    for (const field of event.target.querySelectorAll('input[required], textarea[required], select[required]')) {
      if (field.disabled || ['checkbox','radio','file'].includes(field.type)) continue;
      if (!field.value.trim()) {
        field.setCustomValidity('Vui lòng nhập nội dung, không chỉ khoảng trắng');
        event.preventDefault(); event.stopPropagation(); field.reportValidity(); return;
      }
    }
  };
  const explainInvalid = event => {
    if (layers.at(-1) !== root.current) return;
    const field = event.target, state = field.validity;
    if (!state || state.customError) return;
    if (state.valueMissing) field.setCustomValidity(field.tagName === 'SELECT' ? 'Vui lòng chọn một giá trị' : 'Vui lòng nhập trường bắt buộc này');
    else if (state.typeMismatch) field.setCustomValidity('Vui lòng nhập đúng định dạng email hoặc địa chỉ');
    else if (state.patternMismatch) field.setCustomValidity(field.type === 'tel' ? 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0 hoặc dùng +84' : 'Nội dung chưa đúng định dạng yêu cầu');
    else if (state.rangeOverflow) field.setCustomValidity(`Giá trị không được vượt quá ${field.max}`);
    else if (state.rangeUnderflow) field.setCustomValidity(`Giá trị phải từ ${field.min} trở lên`);
    else if (state.stepMismatch || state.badInput) field.setCustomValidity('Vui lòng nhập số hợp lệ theo đơn vị cho phép');
  };
  const clearValidity = event => {
    event.target.setCustomValidity?.('');
    // A changed option can also change constraints on another field (e.g. percent → amount).
    for (const field of event.target.form?.querySelectorAll('input,select,textarea') || []) if (field.validity.customError) field.setCustomValidity('');
  };
  return createPortal(<div ref={root} onSubmitCapture={validateRequired} onInvalidCapture={explainInvalid} onInputCapture={clearValidity} className={`modal-layer ${drawer ? 'drawer-layer' : ''} fixed inset-0 z-[10000]`} role={label ? 'dialog' : undefined} aria-modal={label ? true : undefined} aria-label={label} tabIndex={-1}>{children}</div>, document.body);
}
