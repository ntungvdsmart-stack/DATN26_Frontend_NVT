import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  addItem: (product) => {
    const currentItems = get().items;
    const existing = currentItems.find(item => item.id === product.id);
    if (existing) {
      set({ items: currentItems.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item) });
    } else {
      set({ items: [...currentItems, { ...product, qty: 1 }] });
    }
    set({ isOpen: true }); // Mở giỏ hàng khi thêm
  },
  removeItem: (id) => set({ items: get().items.filter(item => item.id !== id) }),
  updateQuantity: (id, delta) => set({
    items: get().items.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    })
  }),
  get totalItems() {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
  get totalPrice() {
    return get().items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
}))
