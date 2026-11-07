import './globals.css';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#ffca3a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <title>Ruleta de la Fortuna</title>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%23ffca3a'/%3E%3Ccircle cx='50' cy='50' r='14' fill='%230a0f1e'/%3E%3Cpath d='M50 2 58 20H42Z' fill='%23e63946'/%3E%3C/svg%3E" />
      </head>
      <body style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ marginLeft: 260, width: 'calc(100% - 260px)', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
