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

// ── Page-level Suspense fallback (inline, no full-screen loader) ──
const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="animate-spin h-8 w-8 text-primary" />
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <Routes>
          {/* Public Routes - eager loaded for critical path */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          
          {/* Checkout flow - lazy loaded with inline fallback */}
          <Route path="/cart" element={<Suspense fallback={<PageFallback />}><CartPage /></Suspense>} />
          <Route path="/checkout" element={<Suspense fallback={<PageFallback />}><CheckoutPage /></Suspense>} />
          <Route path="/checkout/success" element={<Suspense fallback={<PageFallback />}><CheckoutSuccessPage /></Suspense>} />
          <Route path="/checkout/cancel" element={<Suspense fallback={<PageFallback />}><CheckoutCancelPage /></Suspense>} />

          {/* Admin Routes - lazy loaded with inline fallback */}
          <Route path="/admin" element={<Suspense fallback={<PageFallback />}><DashboardLayout /></Suspense>}>
            <Route index element={<Suspense fallback={<PageFallback />}><DashboardOverview /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<PageFallback />}><ProductsList /></Suspense>} />
            <Route path="products/new" element={<Suspense fallback={<PageFallback />}><ProductForm /></Suspense>} />
            <Route path="products/:id/edit" element={<Suspense fallback={<PageFallback />}><ProductForm /></Suspense>} />
            <Route path="categories" element={<Suspense fallback={<PageFallback />}><CategoriesList /></Suspense>} />
            <Route path="categories/new" element={<Suspense fallback={<PageFallback />}><CategoryForm /></Suspense>} />
            <Route path="categories/:id/edit" element={<Suspense fallback={<PageFallback />}><CategoryForm /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<PageFallback />}><OrdersList /></Suspense>} />
            <Route path="orders/:id" element={<Suspense fallback={<PageFallback />}><OrderDetailsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
          </Route>

          {/* Auth Routes - lazy loaded with inline fallback */}
          <Route path="/login" element={<Suspense fallback={<PageFallback />}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<PageFallback />}><RegisterPage /></Suspense>} />
          
          {/* 404 Route - lazy loaded with inline fallback */}
          <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense>} />
        </Routes>
      </ErrorBoundary>
      <ToastContainer />
      <SpeedInsights />
    </div>
  );
}

export default App;