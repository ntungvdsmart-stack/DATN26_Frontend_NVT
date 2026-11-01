import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import StorefrontLayout from './components/layout/StorefrontLayout';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const PasswordRecovery = lazy(() => import('./pages/PasswordRecovery'));
const POS = lazy(() => import('./pages/POS'));
const ProductsList = lazy(() => import('./pages/ProductsList'));
const StoreHome = lazy(() => import('./pages/StoreHome'));
const StoreProducts = lazy(() => import('./pages/StoreProducts'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const StaffProfile = lazy(() => import('./pages/StaffProfile'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderManagement = lazy(() => import('./pages/StaffPages.jsx').then(module => ({ default: module.OrderManagement })));
const CustomerManagement = lazy(() => import('./pages/StaffPages.jsx').then(module => ({ default: module.CustomerManagement })));
const ReviewManagement = lazy(() => import('./pages/ReviewManagement'));
const Support = lazy(() => import('./pages/Support'));
const OnlineSales = lazy(() => import('./pages/OnlineSales'));
const Payments = lazy(() => import('./pages/Payments'));
const SystemConfig = lazy(() => import('./pages/SystemConfig'));
const AccountManagement = lazy(() => import('./pages/AccountManagement'));
const BranchManagement = lazy(() => import('./pages/BranchManagement'));
const CategoryBrandManagement = lazy(() => import('./pages/CategoryBrandManagement'));
const PromotionManagement = lazy(() => import('./pages/PromotionManagement'));
const ReturnManagement = lazy(() => import('./pages/ReturnManagement'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));
const FaqManagement = lazy(() => import('./pages/FaqManagement'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { routePermissions } from './lib/permissions';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { role, can, homePath } = useAuth();
  const location = useLocation();
  if (role === 'guest') return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allowedRoles.includes(role)) {
    if (role === 'customer') return <Navigate to="/store" replace />;
    if (role === 'staff') return <Navigate to={homePath} replace />;
    return <Navigate to="/dashboard" replace />;
  }
  if (role === 'staff' && !can(routePermissions[location.pathname])) return <Navigate to={homePath} replace />;
  return children;
};

const PublicUserRoute = ({ children }) => {
  const { role, homePath } = useAuth();
  if (role === 'admin') return <Navigate to="/dashboard" replace />;
  if (role === 'staff') return <Navigate to={homePath} replace />;
  return children;
};

function App() {
  const { role, homePath } = useAuth();

  return (
    <Router>
      <Toaster position="top-right" richColors theme="system" />
      <AnimatePresence mode="wait">
        <Suspense fallback={<div role="status" className="p-8 text-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/store" replace />} />

          {/* Login */}
          <Route path="/reset-password" element={<PasswordRecovery />} />
          <Route path="/login" element={role === 'guest' ? <Login /> : <Navigate to={homePath} replace />} />

          {/* Customer Storefront (Public & Customer) */}
          <Route path="/store" element={<PublicUserRoute><StorefrontLayout /></PublicUserRoute>}>
            <Route index element={<StoreHome />} />
            <Route path="products" element={<StoreProducts />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="checkout" element={<ProtectedRoute allowedRoles={['customer']}><Checkout /></ProtectedRoute>} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['customer']}><MyOrders /></ProtectedRoute>} />
            <Route path="tracking" element={<ProtectedRoute allowedRoles={['customer']}><OrderTracking /></ProtectedRoute>} />
            <Route path="faq" element={<FAQ />} />
          </Route>

          {/* Admin & Staff (Dashboard / POS) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']}><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><StaffProfile /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute allowedRoles={['staff']}><POS /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><ProductsList /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><InventoryManagement /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><OrderManagement /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><ReturnManagement /></ProtectedRoute>} />
            <Route path="/online" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><OnlineSales /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><Payments /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><ReviewManagement /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><Support /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><CustomerManagement /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><SystemConfig /></ProtectedRoute>} />
            <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={['admin']}><AccountManagement /></ProtectedRoute>} />
            <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['admin']}><ActivityLogs /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleManagement /></ProtectedRoute>} />
            <Route path="/admin/branches" element={<ProtectedRoute allowedRoles={['admin']}><BranchManagement /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><CategoryBrandManagement /></ProtectedRoute>} />
            <Route path="/admin/promotions" element={<ProtectedRoute allowedRoles={['admin']}><PromotionManagement /></ProtectedRoute>} />
            <Route path="/admin/faqs" element={<ProtectedRoute allowedRoles={['admin']}><FaqManagement /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
        </Suspense>
      </AnimatePresence>
    </Router>
  );
}

export default App;
