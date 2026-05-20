import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  primary: 'bg-[#1E4F91] text-white hover:bg-[#1a4580] shadow-sm',
  secondary: 'border border-[#E4E9F1] bg-white text-[#64748B] hover:text-[#0E1A2B]',
  danger: 'bg-[#C8392E] text-white hover:bg-[#b0302a] shadow-sm',
  success: 'bg-[#2E9A5A] text-white hover:bg-[#27864e] shadow-sm',
  ghost: 'text-[#64748B] hover:bg-[#E4E9F1]',
  outline: 'border border-[#E4E9F1] bg-white text-[#64748B] hover:bg-[#F5F7FB]',
};

const sizeStyles = {
  xs: 'px-2 py-1 text-[10px] rounded-lg',
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-3 py-2 text-sm rounded-xl',
  lg: 'px-4 py-2 text-sm rounded-xl',
};

const Button = forwardRef(({ className, variant = 'primary', size = 'lg', icon: Icon, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 font-semibold transition-all',
      variantStyles[variant],
      sizeStyles[size],
      props.disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
    {...props}
  >
    {Icon && <Icon size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />}
    {children}
  </button>
));

Button.displayName = 'Button';
export default Button;
