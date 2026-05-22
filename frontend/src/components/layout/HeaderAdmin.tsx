import { Menu } from "@/components/icons";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { initNotifications, useNotificationsSocket } from "@/store/notifications";
import { useEffect } from "react";

interface HeaderAdminProps {
  className?: string;
  onMenuClick?: () => void;
}

export function HeaderAdmin({ className, onMenuClick }: HeaderAdminProps) {
  useNotificationsSocket();

  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 lg:left-64 h-16 bg-surface-container-low border-b border-outline-variant/30 z-40 ${className || ""}`}
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container transition-colors lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <p className="truncate text-sm font-medium text-on-surface-variant lg:hidden">
            Panel Kioto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
