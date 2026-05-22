import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { HeaderAdmin } from "@/components/layout/HeaderAdmin";
import { useIsAuthenticated, useIsAdmin, useUser } from "@/store/auth";
import { Link } from "react-router-dom";

export function DashboardLayout() {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const user = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-8 text-center">
          <h1 className="font-serif text-2xl font-bold text-on-surface mb-2">
            Acceso restringido
          </h1>
          <p className="text-sm text-on-surface-variant mb-6">
            La cuenta {user?.email} no tiene permisos de administrador.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        mobileOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col min-w-0 pt-16 lg:pt-16">
        <HeaderAdmin onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
