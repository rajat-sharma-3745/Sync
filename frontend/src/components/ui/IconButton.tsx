import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const IconButton = ({ className, children, ...rest }: IconButtonProps) => {
  return (
    <button
      className={clsx(
        'inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
        className,
      )}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
};

export default IconButton;

