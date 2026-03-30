import type { ButtonHTMLAttributes, PropsWithChildren, ReactElement } from 'react';
import { cloneElement, isValidElement } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  /**
   * When true, children should be a single React element that will receive the
   * button styles (useful for styling `Link` components as buttons).
   */
  readonly asChild?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-60';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-500 text-black hover:bg-emerald-400',
  secondary: 'border border-neutral-700 bg-neutral-950 text-neutral-50 hover:bg-neutral-900',
  ghost: 'text-neutral-200 hover:bg-neutral-800/70',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs sm:text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm sm:text-base',
};

const LoadingSpinner = () => (
  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-transparent" />
);

const Button = ({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  asChild,
  children,
  disabled,
  ...rest
}: PropsWithChildren<ButtonProps>) => {
  const classes = clsx(baseClasses, variantClasses[variant], sizeClasses[size], className);
  const isDisabled = disabled ?? loading;

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string,'aria-busy'?: boolean }>;
    return cloneElement(child, {
      ...rest,
      className: clsx(child.props.className, classes),
      'aria-busy': loading ? true : undefined,
    });
  }

  return (
    <button className={classes} disabled={isDisabled} {...rest}>
      {loading && <LoadingSpinner />}
      {children}
    </button>
  );
};

export default Button;


