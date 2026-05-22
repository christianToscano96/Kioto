import { useEffect, useCallback, type RefObject } from "react";
import { X } from "@/components/icons";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  closable?: boolean;
  contentClassName?: string;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  fullHeight?: boolean;
}


export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxHeight = "auto",
  closable = true,
  contentClassName = "",
  scrollContainerRef,
  fullHeight = false,
}: BottomSheetProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen && closable) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, closable, handleEscape]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closable) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const resolvedMaxHeight = maxHeight === "auto" ? "85dvh" : maxHeight;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label={typeof title === 'string' ? title : 'Product quick add'}
    >
      <div className="absolute inset-0 bg-black/50 transition-opacity" />

      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface-container-low shadow-2xl animate-slide-up"
        style={{
          maxHeight: resolvedMaxHeight,
          ...(fullHeight ? { height: resolvedMaxHeight } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2.5 pb-1.5">
          <div className="h-1 w-9 rounded-full bg-outline-variant" />
        </div>

        {(title || closable) && (
          <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/30 px-4 py-2.5">
            {title && typeof title === 'string' ? (
              <h2 className="font-serif text-base font-bold text-on-surface">
                {title}
              </h2>
            ) : (
              <div className="min-w-0 flex-1">{title}</div>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            )}
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className={`min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 [-webkit-overflow-scrolling:touch] ${contentClassName}`}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-outline-variant/20 bg-surface-container-low">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
