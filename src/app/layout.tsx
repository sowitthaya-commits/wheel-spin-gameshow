import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Game Show Wheel Spin',
  description: 'Real-time synchronized multiplayer game show wheel spin web application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased selection:bg-gold selection:text-black">
        {children}
      </body>
    </html>
  );
}
