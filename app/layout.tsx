import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'copypast Documentation',
  description: 'Private admin publishing for copy/past API files.',
  icons: {
    icon: '/brand-mark.svg'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
