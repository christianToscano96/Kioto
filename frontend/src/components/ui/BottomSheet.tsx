import { useEffect, useCallback } from "react";
import { X } from "@/components/icons";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  closable?: boolean;
  contentClassName?: string;
}


export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "auto",
  closable = true,
  contentClassName = "",
}: BottomSheetProps) {
  // Cerrar con Escape
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen && closable) {
      document.addEventListener("keydown", handleEscape);
      // Bloquea scroll del body mientras está abierto
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, closable, handleEscape]);

  // Cerrar tocando el backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closable) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label={typeof title === 'string' ? title : 'Product quick add'}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 transition-opacity" />

      {/* Sheet */}
      <div
        className={`relative w-full bg-surface-container-low rounded-t-2xl shadow-2xl animate-slide-up ${
          maxHeight !== "auto" ? `max-h-[${maxHeight}]` : ""
        }`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1.5">
          <div className="w-9 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/30">
            {title && typeof title === 'string' ? (
              <h2 className="font-serif text-base font-bold text-on-surface">
                {title}
              </h2>
            ) : (
              <div className="flex-1 min-w-0">{title}</div>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors ml-auto"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`px-4 pb-6 overflow-y-auto ${
            maxHeight === "auto" ? "max-h-[80vh]" : ""
          } ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
