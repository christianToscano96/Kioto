import type { ColorOption } from '@/lib/variantSelection';

interface ColorSwatchProps {
  options: ColorOption[];
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
  compact?: boolean;
  className?: string;
}

export function ColorSwatch({
  options,
  selectedColor,
  onSelectColor,
  compact = false,
  className = '',
}: ColorSwatchProps) {
  if (options.length === 0) return null;

  return (
    <div className={className}>
      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-label">
        Seleccionar color
      </span>
      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-4 gap-3'}`}>
        {options.map((option) => {
          const isOut = option.stock === 0;
          const isActive = selectedColor === option.color;
          const sizeClass = compact ? 'w-9 h-9 min-h-[36px] min-w-[36px]' : 'w-11 h-11 min-h-[44px] min-w-[44px]';

          return (
            <div key={option.color} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => !isOut && onSelectColor(option.color)}
                disabled={isOut}
                aria-pressed={isActive}
                aria-label={`Color ${option.label}${isOut ? ', agotado' : ''}`}
                className={`rounded-full border-2 transition-all ${sizeClass} ${
                  isActive
                    ? 'border-primary scale-110 ring-2 ring-primary/25'
                    : isOut
                      ? 'border-outline-variant/25 opacity-35 cursor-not-allowed grayscale'
                      : 'border-outline-variant hover:border-primary hover:scale-105'
                }`}
                style={{ backgroundColor: option.color }}
                title={
                  isOut
                    ? `${option.label} · Agotado`
                    : `${option.label} · ${option.stock} en stock`
                }
              />
              {!compact && (
                <span className="text-[10px] text-on-surface-variant max-w-[56px] truncate text-center">
                  {option.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {selectedColor && (
        <p className="mt-2 text-xs text-on-surface-variant">
          {options.find((option) => option.color === selectedColor)?.label}
          {' · '}
          {options.find((option) => option.color === selectedColor)?.stock ?? 0} disponibles
        </p>
      )}
    </div>
  );
}
