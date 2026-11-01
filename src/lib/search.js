export const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export const matchesProduct = (product, query) => {
  const text = normalizeSearch([product.product_name, product.category_name, product.parent_category_name, product.brand_name].join(' '));
  return normalizeSearch(query).split(/\s+/).every(word => text.includes(word));
};
