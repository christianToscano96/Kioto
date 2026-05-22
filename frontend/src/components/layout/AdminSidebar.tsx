import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Icon } from "@/components/icons";
import {
  BarChart3,
  Package,
  Tags,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from "@/components/icons";

const navItems = [
  { to: "/admin", label: "Tablero", icon: BarChart3, exact: true },
  { to: "/admin/products", label: "Productos", icon: Package },
  { to: "/admin/categories", label: "Categorías", icon: Tags },
  { to: "/admin/orders", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/settings", label: "Configuración", icon: Settings },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onNavigate }: AdminSidebarProps) {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-outline/40 bg-background transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-start justify-between p-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-on-surface tracking-tight">
            Kioto
          </h1>
          <p className="text-xs text-on-surface-variant/70 font-medium tracking-widest uppercase mt-1">
            Panel de Control
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-lg p-2 text-on-surface-variant hover:bg-surface lg:hidden"
          aria-label="Cerrar menú"
        >
          <Icon icon={X} size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface hover:text-on-surface",
              )
            }
          >
            {item.icon && (
              <span className="shrink-0 text-inherit">
                <Icon icon={item.icon} size={24} />
              </span>
            )}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-outline/40 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface"
        >
          <span className="shrink-0 text-inherit">
            <Icon icon={LogOut} size={24} />
          </span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
