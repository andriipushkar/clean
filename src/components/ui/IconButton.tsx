import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  badge?: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, badge, label, size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`relative inline-flex items-center justify-center rounded-[var(--radius)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-secondary)] ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
export default IconButton;
