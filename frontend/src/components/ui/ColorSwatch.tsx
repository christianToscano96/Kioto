import type { ColorOption } from '@/lib/variantSelection';

interface ColorSwatchProps {
  options: ColorOption[];
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
  compact?: boolean;
  className?: string;
}

function getSelectedMeta(option: ColorOption | undefined): string | null {
  if (!option) return null;
  if (option.stock === 0) return `${option.label} · Agotado`;
  if (option.stock <= 5) return `${option.label} · Quedan ${option.stock}`;
  return option.label;
}

export function ColorSwatch({
  options,
  selectedColor,
  onSelectColor,
  compact = false,
  className = '',
}: ColorSwatchProps) {
  if (options.length === 0) return null;

  const selectedOption = options.find((option) => option.color === selectedColor);
  const selectedMeta = getSelectedMeta(selectedOption);
  const swatchSize = compact ? 'h-9 w-9 min-h-[36px] min-w-[36px]' : 'h-11 w-11 min-h-[44px] min-w-[44px]';

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">
          Color
        </span>
        {selectedMeta ? (
          <span className="truncate text-xs text-on-surface-variant">{selectedMeta}</span>
        ) : (
          <span className="text-xs text-on-surface-variant/70">Elegí uno</span>
        )}
      </div>

      <div className={`flex flex-wrap ${compact ? 'gap-2' : 'gap-3'}`}>
        {options.map((option) => {
          const isOut = option.stock === 0;
          const isActive = selectedColor === option.color;

          return (
            <button
              key={option.color}
              type="button"
              onClick={() => !isOut && onSelectColor(option.color)}
              disabled={isOut}
              aria-pressed={isActive}
              aria-label={`Color ${option.label}${isOut ? ', agotado' : ''}`}
              className={`rounded-full border-2 transition-all ${swatchSize} ${
                isActive
                  ? 'scale-110 border-primary ring-2 ring-primary/25'
                  : isOut
                    ? 'cursor-not-allowed border-outline-variant/25 opacity-35 grayscale'
                    : 'border-outline-variant hover:scale-105 hover:border-primary'
              }`}
              style={{ backgroundColor: option.color }}
              title={
                isOut
                  ? `${option.label} · Agotado`
                  : `${option.label} · ${option.stock} en stock`
              }
            />
          );
        })}
      </div>
    </div>
  );
}
