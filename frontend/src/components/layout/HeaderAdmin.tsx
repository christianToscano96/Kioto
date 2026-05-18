import { Search, MessageCircle } from '@/components/icons';

import { NotificationBell } from "@/components/ui/NotificationBell";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { initNotifications, useNotificationsSocket } from "@/store/notifications";
import { useEffect } from "react";

interface HeaderAdminProps {
  className?: string;
}

export function HeaderAdmin({ className }: HeaderAdminProps) {
  useNotificationsSocket();

  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <header className={`fixed top-0 right-0 left-64 h-16 bg-surface-container-low border-b border-outline-variant/30 z-40 ${className || ''}`}>
      <div className="flex items-center justify-between h-full px-6">
       
        <div className="flex-1 max-w-md"> 
          {/* Search
          <div className="relative">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search orders, products..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>Bar */}
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationBell />

          {/* Chat 
          <button className="p-2 rounded-lg hover:bg-surface-container transition-colors">
            <MessageCircle size={20} className="text-on-surface-variant" />
          </button>
          */}
           {/* Profile */}
           <UserDropdown />
        </div>
      </div>
    </header>
  );
}