import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface QuickAddPanel {
  /** ID del producto que se está agregando al carrito */
  productId: string | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

/** Panel lateral derecho para agregar al carrito desde cualquier tarjeta */
interface QuickAddSidebar {
  productId: string | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

interface UiState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  notifications: Notification[];
  quickAddPanel: QuickAddPanel;
  quickAddSidebar: QuickAddSidebar;
}

interface UiActions {
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Quick Add Panel
  openQuickAdd: (productId: string) => void;
  closeQuickAdd: () => void;
  setQuickAddSize: (size: string) => void;
  setQuickAddColor: (color: string) => void;
  setQuickAddQuantity: (qty: number) => void;
  resetQuickAdd: () => void;
  // Quick Add Sidebar (derecho)
  openQuickAddSidebar: (productId: string) => void;
  closeQuickAddSidebar: () => void;
  setSidebarSize: (size: string) => void;
  setSidebarColor: (color: string) => void;
  setSidebarQuantity: (qty: number) => void;
  resetSidebar: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>((set) => ({
  // State
  isMobileMenuOpen: false,
  isSearchOpen: false,
  notifications: [],
  quickAddPanel: {
    productId: null,
    selectedSize: "",
    selectedColor: "",
    quantity: 1,
  },
  quickAddSidebar: {
    productId: null,
    selectedSize: "",
    selectedColor: "",
    quantity: 1,
  },

  // Mobile menu
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // Search
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  // Notifications
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  // Quick Add Panel
  openQuickAdd: (productId) =>
    set({
      quickAddPanel: {
        productId,
        selectedSize: "",
        selectedColor: "",
        quantity: 1,
      },
    }),
  closeQuickAdd: () =>
    set((state) => ({
      quickAddPanel: { ...state.quickAddPanel, productId: null },
    })),
  setQuickAddSize: (size) =>
    set((state) => ({
      quickAddPanel: { ...state.quickAddPanel, selectedSize: size },
    })),
  setQuickAddColor: (color) =>
    set((state) => ({
      quickAddPanel: { ...state.quickAddPanel, selectedColor: color },
    })),
  setQuickAddQuantity: (qty) =>
    set((state) => ({
      quickAddPanel: { ...state.quickAddPanel, quantity: Math.max(1, qty) },
    })),
  resetQuickAdd: () =>
    set({
      quickAddPanel: {
        productId: null,
        selectedSize: "",
        selectedColor: "",
        quantity: 1,
      },
    }),

  // ── Quick Add Sidebar (derecho) ────────────────────────────
  openQuickAddSidebar: (productId) =>
    set({
      quickAddSidebar: {
        productId,
        selectedSize: "",
        selectedColor: "",
        quantity: 1,
      },
    }),
  closeQuickAddSidebar: () =>
    set((state) => ({
      quickAddSidebar: { ...state.quickAddSidebar, productId: null },
    })),
  setSidebarSize: (size) =>
    set((state) => ({
      quickAddSidebar: { ...state.quickAddSidebar, selectedSize: size },
    })),
  setSidebarColor: (color) =>
    set((state) => ({
      quickAddSidebar: { ...state.quickAddSidebar, selectedColor: color },
    })),
  setSidebarQuantity: (qty) =>
    set((state) => ({
      quickAddSidebar: { ...state.quickAddSidebar, quantity: Math.max(1, qty) },
    })),
  resetSidebar: () =>
    set({
      quickAddSidebar: {
        productId: null,
        selectedSize: "",
        selectedColor: "",
        quantity: 1,
      },
    }),
}));

// Selectors
export const useIsMobileMenuOpen = () => useUiStore((state) => state.isMobileMenuOpen);
export const useIsSearchOpen = () => useUiStore((state) => state.isSearchOpen);
export const useNotifications = () => useUiStore((state) => state.notifications);
export const useQuickAddPanel = () => useUiStore((state) => state.quickAddPanel);
export const useOpenQuickAdd = () => useUiStore((state) => state.openQuickAdd);
export const useCloseQuickAdd = () => useUiStore((state) => state.closeQuickAdd);
export const useSetQuickAddSize = () => useUiStore((state) => state.setQuickAddSize);
export const useSetQuickAddColor = () => useUiStore((state) => state.setQuickAddColor);
export const useSetQuickAddQuantity = () => useUiStore((state) => state.setQuickAddQuantity);
export const useResetQuickAdd = () => useUiStore((state) => state.resetQuickAdd);
export const useQuickAddSidebar = () => useUiStore((state) => state.quickAddSidebar);
export const useOpenQuickAddSidebar = () => useUiStore((state) => state.openQuickAddSidebar);
export const useCloseQuickAddSidebar = () => useUiStore((state) => state.closeQuickAddSidebar);
export const useSetSidebarSize = () => useUiStore((state) => state.setSidebarSize);
export const useSetSidebarColor = () => useUiStore((state) => state.setSidebarColor);
export const useSetSidebarQuantity = () => useUiStore((state) => state.setSidebarQuantity);
export const useResetSidebar = () => useUiStore((state) => state.resetSidebar);