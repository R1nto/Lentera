import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Akses Admin Internal',
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminAccessLayout({ children }: { children: ReactNode }) {
  return children;
}
