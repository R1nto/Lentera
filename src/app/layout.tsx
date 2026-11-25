import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';


export const metadata: Metadata = {
  title: {
    default: 'LENTERA — Platform Evaluasi, Refleksi, dan Pengembangan Pembelajaran',
    template: '%s | LENTERA',
  },
  description:
    'LENTERA membantu guru menganalisis ketercapaian tujuan pembelajaran, mengelola asesmen, merefleksikan pembelajaran dengan AI, dan membuat modul ajar. Dashboard untuk guru, kepala sekolah, dan wali murid.',
  keywords: [
    'pendidikan',
    'evaluasi pembelajaran',
    'refleksi guru',
    'asesmen',
    'modul ajar',
    'AI education',
    'kurikulum merdeka',
    'ketercapaian pembelajaran',
  ],
  authors: [{ name: 'LENTERA Team' }],
  creator: 'LENTERA',
  publisher: 'LENTERA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lentera.id'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://lentera.id',
    siteName: 'LENTERA',
    title: 'LENTERA — Platform Evaluasi, Refleksi, dan Pengembangan Pembelajaran',
    description:
      'LENTERA membantu guru menganalisis ketercapaian tujuan pembelajaran, mengelola asesmen, merefleksikan pembelajaran dengan AI, dan membuat modul ajar.',
    images: [
      {
        url: '/images/lentera-mascot.png',
        width: 1200,
        height: 630,
        alt: 'LENTERA Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LENTERA — Platform Evaluasi, Refleksi, dan Pengembangan Pembelajaran',
    description:
      'LENTERA membantu guru menganalisis ketercapaian tujuan pembelajaran, mengelola asesmen, merefleksikan pembelajaran dengan AI, dan membuat modul ajar.',
    images: ['/images/lentera-mascot.png'],
    creator: '@lentera_id',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/lentera-mascot.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#17324D' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="antialiased">
      <body className="min-h-screen bg-white text-navy-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}