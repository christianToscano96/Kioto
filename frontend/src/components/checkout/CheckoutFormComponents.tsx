import { ReactNode } from 'react';
import { Lock, ArrowRight } from '@/components/icons';

interface StepperProps {
  steps: Array<{ number: string; label: string; active?: boolean }>;
  className?: string;
}

export function Stepper({ steps, className = '' }: StepperProps) {
  return (
    <div className={`flex gap-8 border-b border-outline-variant/40 pb-4 overflow-x-auto ${className}`}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 pb-4 ${
            step.active ? 'border-b-2 border-primary' : 'opacity-40'
          }`}
        >
          <span className={`font-serif text-xl ${step.active ? 'text-primary font-bold' : ''}`}>
            {step.number}
          </span>
          <span className="font-label uppercase tracking-widest text-sm">
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  loginLink?: { text: string; onClick?: () => void };
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, loginLink, children, className = '' }: FormSectionProps) {
  return (
    <section className={`space-y-12 ${className}`}>
      <div className="flex justify-between items-baseline mb-8">
        <h2 className="font-serif text-2xl">{title}</h2>
        {loginLink && (
          <button
            onClick={loginLink.onClick}
            className="text-sm font-label uppercase tracking-wider underline decoration-dotted underline-offset-4 text-primary"
          >
            {loginLink.text}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

interface FloatingLabelInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FloatingLabelInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
}: FloatingLabelInputProps) {
  return (
    <div className="relative">
      <label className="block font-label text-xs uppercase tracking-widest text-on-surface/60 mb-2">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-transparent border-0 border-b border-outline py-3 focus:border-primary transition-colors font-body text-lg placeholder:text-on-surface/20 px-0 ${className}`}
      />
    </div>
  );
}

interface SecurityBadgeProps {
  message: string;
  className?: string;
}

export function SecurityBadge({ message, className = '' }: SecurityBadgeProps) {
  return (
    <div className={`mt-12 flex items-center gap-3 p-4 bg-surface-container-low border-l-2 border-primary/40 italic text-sm ${className}`}>
      <Lock size={18} className="text-primary" />
      <p>{message}</p>
    </div>
  );
}

interface FloatingLabelSelectProps {
  label: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  className?: string;
}

export function FloatingLabelSelect({
  label,
  value,
  onChange,
  children,
  className = '',
}: FloatingLabelSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <label className="block font-label text-xs uppercase tracking-widest text-on-surface/60 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="relative z-10 w-full bg-background border-0 border-b border-outline py-3 pr-8 focus:border-primary transition-colors font-body text-lg px-0 appearance-none cursor-pointer"
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-3 text-on-surface/50 text-sm"
      >
        ▾
      </span>
    </div>
  );
}

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export function PrimaryButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled,
  className = '' 
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full md:w-auto px-12 py-5 bg-primary text-on-primary font-label uppercase tracking-[0.2em] text-sm hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${className}`}
    >
      {children}
      <ArrowRight size={16} />
    </button>
  );
}