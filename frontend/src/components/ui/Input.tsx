import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = ({ className, ...rest }: InputProps) => {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
        className,
      )}
      {...rest}
    />
  );
};

export default Input;

