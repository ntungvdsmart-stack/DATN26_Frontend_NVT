import React, { useState } from 'react';
import { dummyProducts } from '../utils/dummyData';
import { Search, Edit, Trash2, Plus, Filter, Download, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const PAGE_SIZE = 8;

const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-center gap-2 mt-6">
    <button
      onClick={() => onChange(Math.max(1, page - 1))}
      disabled={page === 1}
      className="w-9 h-9 flex items-center justify-center border border-border rounded-full disabled:opacity-30 hover:bg-muted transition-colors"
    >
      <ChevronLeft size={15} />
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all',
          p === page ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'
        )}
      >
        {p}
      </button>
    ))}
    <button
      onClick={() => onChange(Math.min(totalPages, page + 1))}
      disabled={page === totalPages}
      className="w-9 h-9 flex items-center justify-center border border-border rounded-full disabled:opacity-30 hover:bg-muted transition-colors"
    >
      <ChevronRight size={15} />
    </button>
  </div>
);

const ProductsList = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  const [page, setPage] = useState(1);

  const categories = ['Tất cả', ...Array.from(new Set(dummyProducts.map(p => p.category)))];

  const filtered = dummyProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'Tất cả' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sản phẩm</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý {dummyProducts.length} sản phẩm trong kho</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:bg-foreground/90 transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tên, mã SP..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(1); }}
              className={cn(
                'whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
                categoryFilter === cat ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/50'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Sản phẩm</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Mã SP</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Danh mục</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Giá bán</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tồn kho</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence>
                {paginated.map((product, idx) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase mt-0.5">{product.colors.length} màu · {product.sizes.length} size</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-muted-foreground">{product.id}</td>
                    <td className="px-5 py-3">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold whitespace-nowrap">{product.price.toLocaleString('vi-VN')}đ</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', product.stock > 50 ? 'bg-emerald-500' : product.stock > 20 ? 'bg-amber-500' : 'bg-red-500')} />
                        <span className="font-semibold">{product.stock}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Không tìm thấy sản phẩm nào.</div>
      )}

      {totalPages > 1 && (
        <>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Trang {page} / {totalPages} · Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} sản phẩm
          </p>
        </>
      )}
    </div>
  );
};

export default ProductsList;
