import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import wishlistApi from '../api/wishlistApi';
import productApi from '../api/productApi';
import { toast } from 'sonner';
const pending = new Set();
const changeWishlist = async (product, get) => {
  if (!localStorage.getItem('token')) { toast.error('Vui lòng đăng nhập để lưu sản phẩm yêu thích'); return; }
  const id = product.product_id;
  if (pending.has(id)) return;
  pending.add(id);
  try {
    const saved = get().items.find(item => item.product_id === id);
    let variantId = saved?.variant_id || product.variant_id;
    if (!variantId) variantId = (await productApi.getByIdPublic(id)).data.variants?.[0]?.variant_id;
    if (!variantId) { toast.error('Sản phẩm chưa có biến thể để lưu'); return; }
    await wishlistApi.toggle(variantId);
    await get().fetchWishlist();
  } catch (error) { toast.error(error.message || 'Không cập nhật được danh sách yêu thích'); }
  finally { pending.delete(id); }
};

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [], // Array of { product_id, product_name, base_price, primary_image, brand_name, category_name }
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),

      // Sync từ server
      fetchWishlist: async () => {
        const token = localStorage.getItem('token');
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
            if (localStorage.getItem('token') === token) set({ items: mappedItems });
          }
        } catch  {}
      },

      addItem: async (product) => {
        const exists = get().items.find(i => i.product_id === product.product_id);
        if (!exists) await changeWishlist(product, get);
      },

      removeItem: async (productId) => {
        const itemToRemove = get().items.find(i => i.product_id === productId);
        if (itemToRemove) await changeWishlist(itemToRemove, get);
      },

      isInWishlist: (productId) => {
        return get().items.some(i => i.product_id === productId);
      },

      toggleItem: async (product) => {
        await changeWishlist(product, get);
      },

      clearAll: () => set({ items: [] })
    }),
    {
      name: 'fashionos-wishlist'
    }
  )
);
