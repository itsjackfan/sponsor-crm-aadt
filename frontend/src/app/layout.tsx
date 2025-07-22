import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: "Sponsor CRM Dashboard",
  description: "A modern sponsorship management dashboard with glass-morphism design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
