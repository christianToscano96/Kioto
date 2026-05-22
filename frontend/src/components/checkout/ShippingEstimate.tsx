import { useMemo, useState } from 'react';
import {
  ARGENTINE_PROVINCES,
  calculateShipping,
  formatShippingQuote,
  getProvinceFromPostalCode,
  isLocalPostalCode,
  type ArgentineProvinceId,
  type DeliveryMethod,
} from '@shared/index';

interface ShippingEstimateProps {
  subtotal: number;
  compact?: boolean;
}

export function ShippingEstimate({ subtotal, compact = false }: ShippingEstimateProps) {
  const [postalCode, setPostalCode] = useState('');
  const [provinceId, setProvinceId] = useState<ArgentineProvinceId>('mendoza');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');

  const isLocal = isLocalPostalCode(postalCode);
  const quote = useMemo(
    () =>
      postalCode.trim()
        ? calculateShipping(postalCode, deliveryMethod, provinceId)
        : null,
    [postalCode, deliveryMethod, provinceId],
  );

  const estimatedTotal = quote ? subtotal + quote.cost : subtotal;

  const handlePostalCodeChange = (value: string) => {
    setPostalCode(value);
    const detected = getProvinceFromPostalCode(value, provinceId);
    if (detected) {
      setProvinceId(detected);
    }
  };

  return (
    <div className={`space-y-3 ${compact ? '' : 'pt-4 border-t border-dashed border-outline-variant/40'}`}>
      <label className="block">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          Estimar envío
        </span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Ej: 4512 o 1406"
          value={postalCode}
          onChange={(event) => handlePostalCodeChange(event.target.value)}
          className="mt-2 w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 text-sm font-body px-0 py-2"
        />
      </label>

      {postalCode.trim() && !isLocal && (
        <label className="block">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            Provincia
          </span>
          <select
            value={provinceId}
            onChange={(event) => setProvinceId(event.target.value as ArgentineProvinceId)}
            className="mt-2 w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 text-sm font-body px-0 py-2 appearance-none cursor-pointer"
          >
            {ARGENTINE_PROVINCES.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {isLocal && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDeliveryMethod('shipping')}
            className={`text-left p-3 rounded-lg border text-xs transition-all ${
              deliveryMethod === 'shipping'
                ? 'border-primary bg-primary-container/20'
                : 'border-outline-variant/40'
            }`}
          >
            <span className="font-label uppercase tracking-wider block mb-1">Envío local</span>
            <span className="text-on-surface-variant">A domicilio · Gratis</span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMethod('pickup')}
            className={`text-left p-3 rounded-lg border text-xs transition-all ${
              deliveryMethod === 'pickup'
                ? 'border-primary bg-primary-container/20'
                : 'border-outline-variant/40'
            }`}
          >
            <span className="font-label uppercase tracking-wider block mb-1">Retiro</span>
            <span className="text-on-surface-variant">Punto de entrega · Gratis</span>
          </button>
        </div>
      )}

      {quote && (
        <div
          className={`rounded-lg bg-surface-container px-3 py-2 text-xs ${
            quote.isValid ? 'text-on-surface-variant' : 'text-red-600'
          }`}
        >
          <p>
            {quote.label} · {formatShippingQuote(quote)}
          </p>
          {isLocal && (
            <p className="mt-1 text-primary">
              En checkout podés elegir retiro local si tu CP es 4512.
            </p>
          )}
        </div>
      )}

      {quote && quote.isValid && (
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-outline-variant/30">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            Total estimado
          </span>
          <span className="font-serif text-lg text-primary">${estimatedTotal.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
