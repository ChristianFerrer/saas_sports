import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SmartSpots',
    template: '%s · SmartSpots'
  },
  description: 'Gestión digital para escuelas deportivas.',
  applicationName: 'SmartSpots',
  appleWebApp: {
    capable: true,
    title: 'SmartSpots',
    statusBarStyle: 'default'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a1222' },
    { media: '(prefers-color-scheme: dark)', color: '#060b16' }
  ]
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-navy-950 text-ink-50 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
