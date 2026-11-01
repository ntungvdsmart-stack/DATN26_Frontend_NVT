import { useEffect, useState } from 'react';

export default function useListPagination(items, resetKey = '', initialSize = 10) {
  const [state, setState] = useState({ page: 1, size: initialSize, key: resetKey });
  const totalPages = Math.max(1, Math.ceil(items.length / state.size));
  const page = state.key === resetKey ? Math.min(state.page, totalPages) : 1;
  useEffect(() => {
    if (state.page !== page || state.key !== resetKey) setState(current => ({ ...current, page, key: resetKey }));
  }, [page, resetKey, state.page, state.key]);
  return {
    items: items.slice((page - 1) * state.size, page * state.size),
    paginationProps: {
      page, totalPages, totalItems: items.length, pageSize: state.size,
      onChange: next => setState(current => ({ ...current, page: Math.max(1, Math.min(totalPages, next)), key: resetKey })),
      onPageSizeChange: size => setState({ page: 1, size, key: resetKey })
    }
  };
}
