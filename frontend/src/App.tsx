import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { Loader2 } from '@/components/icons';
import { SpeedInsights } from '@vercel/speed-insights/react';

// ── Eager-loaded (critical path) ──────────────────────────
import { HomePage } from '@/pages/public/HomePage';
import { ProductsListPage } from '@/pages/public/ProductsListPage';
import { ProductDetailPage } from '@/pages/public/ProductDetailPage';

// ── Lazy-loaded (split bundles) ───────────────────────────
// Auth
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));

// Public checkout flow
const CartPage = lazy(() => import('@/pages/public/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/public/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import('@/pages/public/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })));
const CheckoutCancelPage = lazy(() => import('@/pages/public/CheckoutCancelPage').then(m => ({ default: m.CheckoutCancelPage })));

// Admin (heavy bundle - only load when needed)
const DashboardLayout = lazy(() => import('@/pages/admin/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardOverview = lazy(() => import('@/pages/admin/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const ProductsList = lazy(() => import('@/pages/admin/ProductsList').then(m => ({ default: m.ProductsList })));
const ProductForm = lazy(() => import('@/pages/admin/ProductForm').then(m => ({ default: m.ProductForm })));
const CategoriesList = lazy(() => import('@/pages/admin/CategoriesList').then(m => ({ default: m.CategoriesList })));
const CategoryForm = lazy(() => import('@/pages/admin/CategoryForm').then(m => ({ default: m.CategoryForm })));
const OrdersList = lazy(() => import('@/pages/admin/OrdersList').then(m => ({ default: m.OrdersList })));
const OrderDetailsPage = lazy(() => import('@/pages/admin/OrderDetailsPage').then(m => ({ default: m.OrderDetailsPage })));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Error pages
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// ── Loading fallback ───────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="animate-spin h-8 w-8 text-primary" />
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes - eager loaded for critical path */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            
            {/* Checkout flow - lazy loaded */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

            {/* Admin Routes - lazy loaded (heavy bundle) */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="products" element={<ProductsList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="categories" element={<CategoriesList />} />
              <Route path="categories/new" element={<CategoryForm />} />
              <Route path="categories/:id/edit" element={<CategoryForm />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/:id" element={<OrderDetailsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Auth Routes - lazy loaded */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 404 Route - lazy loaded */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
      <SpeedInsights />
    </div>
  );
}

export default App;