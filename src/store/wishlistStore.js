import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import wishlistApi from '../api/wishlistApi';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [], // Array of { product_id, product_name, base_price, primary_image, brand_name, category_name }
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),

      // Sync từ server
      fetchWishlist: async () => {
        try {
          const res = await wishlistApi.get();
          if (res && res.success) {
            // DB trả về: product_id, product_name, price, image_url
            const mappedItems = res.data.map(dbItem => ({
              product_id: dbItem.product_id,
              variant_id: dbItem.variant_id,
              product_name: dbItem.product_name,
              base_price: dbItem.price,
              primary_image: dbItem.image_url,
              color: dbItem.color,
              size: dbItem.size
            }));
            set({ items: mappedItems });
          }
        } catch (error) {}
      },

      addItem: async (product) => {
        const exists = get().items.find(i => i.product_id === product.product_id);
        if (!exists) {
          set(state => ({ items: [...state.items, product] }));
        }
        try { await wishlistApi.toggle(product.variant_id || product.product_id); } catch (e) {}
      },

      removeItem: async (productId) => {
        const itemToRemove = get().items.find(i => i.product_id === productId);
        set(state => ({ items: state.items.filter(i => i.product_id !== productId) }));
        if (itemToRemove) {
          try { await wishlistApi.toggle(itemToRemove.variant_id || itemToRemove.product_id); } catch (e) {}
        }
      },

      isInWishlist: (productId) => {
        return get().items.some(i => i.product_id === productId);
      },

      toggleItem: async (product) => {
        const exists = get().items.find(i => i.product_id === product.product_id);
        if (exists) {
          set(state => ({ items: state.items.filter(i => i.product_id !== product.product_id) }));
        } else {
          set(state => ({ items: [...state.items, product] }));
        }
        try { await wishlistApi.toggle(product.variant_id || product.product_id); } catch (e) {}
      },

      clearAll: () => set({ items: [] })
    }),
    {
      name: 'fashionos-wishlist'
    }
  )
);
