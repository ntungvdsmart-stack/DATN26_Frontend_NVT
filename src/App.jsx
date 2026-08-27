import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import StorefrontLayout from './components/layout/StorefrontLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import POS from './pages/POS';
import ProductsList from './pages/ProductsList';
import StoreHome from './pages/StoreHome';
import { OrderManagement, CustomerManagement } from './pages/StaffPages';
import Reports from './pages/Reports';
import Support from './pages/Support';
import OnlineSales from './pages/OnlineSales';
import Payments from './pages/Payments';
import SystemConfig from './pages/SystemConfig';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

// Placeholder for pages not yet built
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
    <div className="text-6xl mb-6">🚧</div>
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { role } = useAuth();
  const location = useLocation();
  if (role === 'guest') return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allowedRoles.includes(role)) {
    if (role === 'customer') return <Navigate to="/store" replace />;
    if (role === 'staff') return <Navigate to="/pos" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { role } = useAuth();

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/store" replace />} />

          {/* Login */}
          <Route path="/login" element={role === 'guest' ? <Login /> : <Navigate to={role === 'customer' ? '/store' : role === 'staff' ? '/pos' : '/dashboard'} replace />} />

          {/* Customer Storefront (Public & Customer) */}
          <Route path="/store" element={<StorefrontLayout />}>
            <Route index element={<StoreHome />} />
            <Route path="products" element={<ComingSoon title="Tất cả sản phẩm" />} />
            <Route path="categories" element={<ComingSoon title="Danh mục" />} />
            <Route path="sale" element={<ComingSoon title="Khuyến mãi" />} />
          </Route>

          {/* Admin & Staff (Dashboard / POS) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']}><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><POS /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute allowedRoles={['admin']}><ProductsList /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><OrderManagement /></ProtectedRoute>} />
            <Route path="/online" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><OnlineSales /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><Payments /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><Support /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><CustomerManagement /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><SystemConfig /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
