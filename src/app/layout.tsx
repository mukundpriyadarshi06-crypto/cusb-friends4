import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Phygital Vault | Trading Card Marketplace',
  description: 'Physical-to-digital trading card vault, QR scanner, and P2P marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
