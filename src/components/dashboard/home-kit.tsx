'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';

export function HomeHero({ name, description, href, action, eyebrow, variant = 'guru' }: { name: string; description: string; href: string; action: string; eyebrow: string; variant?: 'guru' | 'kepala' | 'wali' | 'admin' }) {
  return (
    <section className={`lentera-home-hero lentera-home-hero--${variant}`} aria-label="Selamat datang di LENTERA">
      <div className="lentera-hero-content">
        <span className="lentera-hero-eyebrow">✦ {eyebrow}</span>
        <h1>Selamat datang,<br /><span>{name}!</span> <span aria-hidden="true">👋</span></h1>
        <p>{description}</p>
        <Link href={href} className="lentera-hero-action">{action}<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
      <div className="lentera-hero-art" aria-hidden="true">
        <div className="lentera-hero-sun" />
        <div className="lentera-hero-hill lentera-hero-hill--back" />
        <div className="lentera-hero-hill lentera-hero-hill--front" />
        <div className="lentera-hero-spark lentera-hero-spark--a">✦</div>
        <div className="lentera-hero-spark lentera-hero-spark--b">✦</div>
        <Image src="/images/lentera-mascot.png" width={300} height={300} alt="" className="lentera-hero-mascot" priority />
      </div>
    </section>
  );
}

export function HomeMetric({ label, value, icon: Icon, href, color = 'mint', detail }: { label: string; value: string | number; icon: LucideIcon; href: string; color?: 'mint' | 'blue' | 'cream' | 'lilac'; detail?: string }) {
  return <Link href={href} className={`lentera-home-metric lentera-home-metric--${color}`}>
    <span className="lentera-metric-icon"><IllustratedIcon icon={Icon} label={label} tone={color} size="md" /></span>
    <span className="lentera-metric-label"><strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</span>
    <ArrowRight className="lentera-metric-arrow" size={17} aria-hidden="true" />
  </Link>;
}

export function HomePanel({ title, action, href, children, className = '' }: { title: string; action?: string; href?: string; children: ReactNode; className?: string }) {
  return <section className={`lentera-home-panel ${className}`}>
    <div className="lentera-panel-heading"><h2>{title}</h2>{action && href && <Link href={href}>{action} <ArrowRight size={14} /></Link>}</div>
    <div className="lentera-panel-body">{children}</div>
  </section>;
}

export function HomeQuickAction({ icon: Icon, title, href, color = 'mint' }: { icon: LucideIcon; title: string; href: string; color?: 'mint' | 'blue' | 'cream' | 'lilac' }) {
  return <Link href={href} className={`lentera-quick-action lentera-quick-action--${color}`}><IllustratedIcon icon={Icon} label={title} tone={color} size="sm" /><span>{title}</span><ArrowRight size={16} className="ml-auto" /></Link>;
}

export function HomeEmpty({ children }: {children: ReactNode}) {
  return <p className="lentera-home-empty">{children}</p>;
}
