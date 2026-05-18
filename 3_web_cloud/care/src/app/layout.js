// src/app/layout.js
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Care-E — Autonomia, seguretat i companyia',
  description: 'Robot domèstic intel·ligent per a la tercera edat.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}