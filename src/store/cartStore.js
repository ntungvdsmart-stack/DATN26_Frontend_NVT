import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
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
        items: get().items
          .map(item => item.id === id ? { ...item, qty: item.qty + delta } : item)
          .filter(item => item.qty > 0) // Tự xóa nếu qty giảm về 0
      }),
      clearCart: () => set({ items: [] }),
      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
      get totalPrice() {
        return get().items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      }
    }),
    {
      name: 'fashion-cart-storage', // tên key trong localStorage
      partialize: (state) => ({ items: state.items }), // chỉ lưu items, không lưu trạng thái isOpen
    }
  )
);

