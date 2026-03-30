import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  readonly name?: string;
  readonly src?: string;
  readonly variant?: 'default' | 'dark';
}

const getInitials = (name?: string): string => {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0)!.toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
};

const getAvatarBgClass = (name?: string): string => {
  const userColors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
  ];

  const safeName = name?.trim() ?? '';
  const colorIndex =
    safeName.length > 0
      ? safeName.charCodeAt(0) % userColors.length
      : 0;

  return userColors[colorIndex]!;
};

const Avatar = ({
  name,
  src,
  variant = 'default',
  className,
  ...rest
}: AvatarProps) => {
  return (
    <div
      className={clsx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold uppercase',
        variant === 'dark' ? 'bg-neutral-600 text-neutral-100' : getAvatarBgClass(name),
        className,
      )}
      {...rest}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};

export default Avatar;

