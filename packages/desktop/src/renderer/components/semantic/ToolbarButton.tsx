import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ToolbarButtonProps extends Omit<ComponentPropsWithoutRef<typeof Button>, 'children'> {
  icon?: ReactNode;
  children?: ReactNode;
}

export default function ToolbarButton({
  icon,
  children,
  className,
  size = 'sm',
  variant = 'ghost',
  ...props
}: ToolbarButtonProps) {
  return (
    <Button variant={variant} size={size} className={cn('titlebar-no-drag gap-1.5', className)} {...props}>
      {icon}
      {children}
    </Button>
  );
}
