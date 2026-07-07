import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'PROTEA · Andrea Delgado — Wedding & Event Planner',
  description:
    'Planeación integral de bodas y eventos de alto perfil en México. Diseño, coordinación y experiencias memorables.',
  openGraph: {
    title: 'PROTEA · Andrea Delgado',
    description: 'Wedding & Event Planning de alto perfil.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
