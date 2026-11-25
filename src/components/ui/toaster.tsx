'use client';

import { Toaster as Sonner } from 'sonner';
import { cn } from '@/lib/utils';

export function Toaster() {
  return (
    <Sonner
      theme="light"
      className={cn('toaster group')}
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toast]:bg-white group-[.toast]:border-navy-200 group-[.toast]:text-navy-950 group-[.toast]:shadow-lg',
          description: 'group-[.toast]:text-navy-500',
          actionButton: 'group-[.toast]:bg-navy-100 group-[.toast]:text-navy-900',
          cancelButton: 'group-[.toast]:text-navy-500',
        },
      }}
    />
  );
}