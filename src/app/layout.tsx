import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediHub - Modern Outpatient Department Management',
  description: 'Clean, modern healthcare management portal for Patients, Doctors, and Administrators in Yangon.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F5F7F5] text-[#1C2A21] min-h-screen antialiased selection:bg-[#CFDDD2] selection:text-[#1C2A21] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
