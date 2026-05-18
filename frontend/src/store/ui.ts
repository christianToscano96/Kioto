import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface QuickAddState {
  /** ID del producto que se está agregando al carrito */
  productId: string | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  surface: 'sheet' | 'sidebar' | null;
}

interface QuickAddViewState {
  productId: string | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

interface UiState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  notifications: Notification[];
  quickAdd: QuickAddState;
}

interface UiActions {
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Quick Add BottomSheet
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

const closedQuickAdd: QuickAddState = {
  productId: null,
  selectedSize: '',
  selectedColor: '',
  quantity: 1,
  surface: null,
};

const openQuickAddState = (
  productId: string,
  surface: QuickAddState['surface'],
): QuickAddState => ({
  productId,
  selectedSize: '',
  selectedColor: '',
  quantity: 1,
  surface,
});

const toQuickAddView = (
  quickAdd: QuickAddState,
  surface: QuickAddState['surface'],
): QuickAddViewState => ({
  productId: quickAdd.surface === surface ? quickAdd.productId : null,
  selectedSize: quickAdd.selectedSize,
  selectedColor: quickAdd.selectedColor,
  quantity: quickAdd.quantity,
});

export const useUiStore = create<UiStore>((set) => ({
  // State
  isMobileMenuOpen: false,
  isSearchOpen: false,
  notifications: [],
  quickAdd: closedQuickAdd,

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

  // Quick Add BottomSheet
  openQuickAdd: (productId) => set({ quickAdd: openQuickAddState(productId, 'sheet') }),
  closeQuickAdd: () =>
    set((state) => ({
      quickAdd: state.quickAdd.surface === 'sheet'
        ? { ...state.quickAdd, productId: null, surface: null }
        : state.quickAdd,
    })),
  setQuickAddSize: (size) =>
    set((state) => ({ quickAdd: { ...state.quickAdd, selectedSize: size } })),
  setQuickAddColor: (color) =>
    set((state) => ({ quickAdd: { ...state.quickAdd, selectedColor: color } })),
  setQuickAddQuantity: (qty) =>
    set((state) => ({
      quickAdd: { ...state.quickAdd, quantity: Math.max(1, qty) },
    })),
  resetQuickAdd: () => set({ quickAdd: closedQuickAdd }),

  // ── Quick Add Sidebar (derecho) ────────────────────────────
  openQuickAddSidebar: (productId) => set({ quickAdd: openQuickAddState(productId, 'sidebar') }),
  closeQuickAddSidebar: () =>
    set((state) => ({
      quickAdd: state.quickAdd.surface === 'sidebar'
        ? { ...state.quickAdd, productId: null, surface: null }
        : state.quickAdd,
    })),
  setSidebarSize: (size) =>
    set((state) => ({ quickAdd: { ...state.quickAdd, selectedSize: size } })),
  setSidebarColor: (color) =>
    set((state) => ({ quickAdd: { ...state.quickAdd, selectedColor: color } })),
  setSidebarQuantity: (qty) =>
    set((state) => ({
      quickAdd: { ...state.quickAdd, quantity: Math.max(1, qty) },
    })),
  resetSidebar: () => set({ quickAdd: closedQuickAdd }),
}));

// Selectors
export const useIsMobileMenuOpen = () => useUiStore((state) => state.isMobileMenuOpen);
export const useIsSearchOpen = () => useUiStore((state) => state.isSearchOpen);
export const useNotifications = () => useUiStore((state) => state.notifications);
export const useQuickAddPanel = () => useUiStore(useShallow((state) => toQuickAddView(state.quickAdd, 'sheet')));
export const useOpenQuickAdd = () => useUiStore((state) => state.openQuickAdd);
export const useCloseQuickAdd = () => useUiStore((state) => state.closeQuickAdd);
export const useSetQuickAddSize = () => useUiStore((state) => state.setQuickAddSize);
export const useSetQuickAddColor = () => useUiStore((state) => state.setQuickAddColor);
export const useSetQuickAddQuantity = () => useUiStore((state) => state.setQuickAddQuantity);
export const useResetQuickAdd = () => useUiStore((state) => state.resetQuickAdd);
export const useQuickAddSidebar = () => useUiStore(useShallow((state) => toQuickAddView(state.quickAdd, 'sidebar')));
export const useOpenQuickAddSidebar = () => useUiStore((state) => state.openQuickAddSidebar);
export const useCloseQuickAddSidebar = () => useUiStore((state) => state.closeQuickAddSidebar);
export const useSetSidebarSize = () => useUiStore((state) => state.setSidebarSize);
export const useSetSidebarColor = () => useUiStore((state) => state.setSidebarColor);
export const useSetSidebarQuantity = () => useUiStore((state) => state.setSidebarQuantity);
export const useResetSidebar = () => useUiStore((state) => state.resetSidebar);
