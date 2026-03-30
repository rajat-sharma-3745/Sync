import type { HTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = ({ className, children, ...rest }: PropsWithChildren<CardProps>) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-neutral-900 bg-neutral-950/90 shadow-[0_18px_60px_rgba(0,0,0,0.75)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;

