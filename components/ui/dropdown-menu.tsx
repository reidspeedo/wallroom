'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = DropdownMenuPrimitive.Content;
const DropdownMenuItem = DropdownMenuPrimitive.Item;

const DropdownMenuContentComponent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className = '', ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContentComponent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItemComponent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    variant?: 'default' | 'destructive';
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
      'focus:bg-slate-100 focus:text-slate-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      variant === 'destructive' && 'text-red-600 focus:bg-red-50 focus:text-red-700',
      className
    )}
    {...props}
  />
));
DropdownMenuItemComponent.displayName = DropdownMenuPrimitive.Item.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContentComponent as DropdownMenuContent,
  DropdownMenuItemComponent as DropdownMenuItem,
};

