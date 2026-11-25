'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, LogOut, UserRound } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  user: { full_name: string; role: string; avatar_url?: string; email?: string };
  onLogout: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const humanize = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function Header({ user, onLogout, breadcrumbs }: HeaderProps) {
  const pathname = usePathname();
  const defaultBreadcrumbs = React.useMemo(() => {
    const base = `/${user.role.replace('_', '-')}`;
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; href?: string }> = [{ label: 'Beranda', href: base }];
    let current = '';
    segments.slice(1).forEach((segment, index, list) => {
      current += `/${segment}`;
      crumbs.push({
        label: humanize(segment),
        href: index === list.length - 1 ? undefined : `${base}${current}`,
      });
    });
    return crumbs;
  }, [pathname, user.role]);
  const displayBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-4 border-b border-[#DAEAF2] bg-white/95 pl-[60px] pr-4 backdrop-blur sm:pr-6 lg:pl-7">
      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#587286]">
            {displayBreadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#A5B1BC]" />}
                {crumb.href ? <Link href={crumb.href} className="truncate transition hover:text-[#1D716B]">{crumb.label}</Link> : <span className="truncate font-bold text-[#17324D]">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <p className="truncate text-sm font-semibold text-[#17324D] sm:hidden">Ruang kerja LENTERA</p>
        <p className="mt-1 hidden text-[10px] text-[#8493A1] sm:block">Kelola informasi pembelajaran dengan lebih terarah.</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-[#DCEBE1] bg-[#F0F8F2] px-3 py-1.5 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#299C96]" />
          <span className="text-[11px] font-semibold text-[#347E6D]">Ruang kerja</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto gap-2 rounded-full p-1.5 pr-2 hover:bg-[#F2F8F2]" aria-label="Menu akun pengguna">
              <Avatar className="h-9 w-9 border border-[#E1EAE0]">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="bg-[#E4F4E9] text-xs font-bold text-[#287F6D]">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[140px] text-left sm:block">
                <span className="block truncate text-xs font-bold text-[#17324D]">{user.full_name}</span>
                <span className="mt-0.5 block text-[10px] capitalize text-[#587286]">{user.role.replace('_', ' ')}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 border-[#E5ECE2] bg-white p-2 text-[#17324D]" align="end" forceMount>
            <DropdownMenuLabel className="px-2 py-2 font-normal">
              <span className="block text-sm font-bold text-[#17324D]">{user.full_name}</span>
              <span className="mt-1 block truncate text-xs text-[#587286]">{user.email || 'Akun LENTERA'}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E8EEE7]" />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-sm text-[#50665C] focus:bg-[#EFF8F1] focus:text-[#287A68]">
              <Link href={`/${user.role.replace('_', '-')}/profil`}><UserRound className="mr-2 h-4 w-4" />Profil saya</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E8EEE7]" />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer rounded-lg text-sm text-[#B54742] focus:bg-[#FFF2F1] focus:text-[#A33C37]">
              <LogOut className="mr-2 h-4 w-4" />Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
