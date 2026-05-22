import { ReactNode, useEffect } from 'react';
import { X } from '@/components/icons';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'left' | 'right' | 'bottom';
  /**
   * Si es `true` el drawer se oculta en pantallas >= lg (1024px).
   * Por defecto `true` para mantener compatibilidad con el Drawer de filtros.
   * Pasar `false` para usar el drawer en desktop también (ej: sidebar de carrito).
   */
  hideOnDesktop?: boolean;
  footer?: ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'left',
  hideOnDesktop = true,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionClasses = {
    left: 'inset-y-0 left-0',
    right: 'inset-y-0 right-0',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh]'
  };

  const transformClasses = {
    left: 'translate-x-0',
    right: 'translate-x-0',
    bottom: 'translate-y-0'
  };

  return createPortal(
    <div className={`fixed inset-0 z-50 ${hideOnDesktop ? 'lg:hidden' : ''}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute ${positionClasses[position]} w-full max-w-sm bg-background shadow-xl transform transition-transform duration-300 ${transformClasses[position]}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 min-h-[56px]">
            <h2 className="font-label text-sm uppercase tracking-widest text-primary">
              {title || 'Filtros'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container min-h-[44px] min-w-[44px]"
              aria-label="Cerrar filtros"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>

          {footer && (
            <div className="border-t border-outline-variant/20 bg-background p-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}