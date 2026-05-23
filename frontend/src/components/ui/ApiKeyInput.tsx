import { useState } from 'react';
import { Eye, EyeOff } from '@/components/icons';

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secret?: boolean;
}

export function ApiKeyInput({ label, value, onChange, secret = false }: ApiKeyInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-on-surface">{label}</label>
      <div className="relative">
        <input
          type={show || !secret ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={secret ? (value === '__CONFIGURED__' ? 'Clave guardada (dejar vacío para mantener)' : 'Dejar vacío para usar .env') : 'Ingresá la clave'}
          className="w-full h-10 px-3 rounded-lg border border-outline bg-white text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            aria-label={show ? 'Ocultar clave' : 'Mostrar clave'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}