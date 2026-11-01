export const routePermissions = {
  '/pos': 'pos.sell', '/products': 'products.read', '/inventory': 'inventory.read',
  '/orders': 'orders.read', '/online': 'orders.read', '/returns': 'returns.manage',
  '/reviews': 'orders.read', '/payments': 'orders.read', '/support': 'support.manage', '/customers': 'customers.read',
};
export const canAccess = (user, permission) => user?.role === 'admin' || !permission || user?.permissions?.includes(permission);
export const homeForUser = user => {
  if (user?.role === 'admin') return '/dashboard';
  if (user?.role !== 'staff') return '/store';
  return ['/pos', '/orders', '/inventory', '/products', '/support'].find(path => canAccess(user, routePermissions[path])) || '/profile';
};
