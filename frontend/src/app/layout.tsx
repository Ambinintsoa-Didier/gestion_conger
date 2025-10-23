import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext'; // 👈 IMPORT AJOUTÉ
import { ToastContainer } from '@/components/Toast'; // 👈 IMPORT AJOUTÉ
import { NotificationProvider } from '../contexts/NotificationContext'; // 👈 IMPORT AJOUTÉ

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gestion des Congés',
  description: 'Application de gestion des congés',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider> {/* 👈 PROVIDER AJOUTÉ */}
            <NotificationProvider> {/* 👈 PROVIDER AJOUTÉ */}
              {children}
              <ToastContainer /> {/* 👈 COMPOSANT TOAST AJOUTÉ ICI */}
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}