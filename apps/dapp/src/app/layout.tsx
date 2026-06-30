import '@/app/globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"; // <-- Importamos tu nuevo proveedor
import { PrivyClientProvider } from "@/components/privy-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'TrustBid dApp',
  description: 'Gestión transparente de fondos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Agregamos suppressHydrationWarning para que next-themes no tire warnings en la consola del navegador
    <html lang="es" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      {/* 
        Cambiamos las clases del body: 
        - Por defecto (Modo Claro): Fondo gris amigable claro (bg-zinc-50) y texto oscuro (text-zinc-900)
        - Con el prefijo dark: (Modo Oscuro): Tu fondo negro original (dark:bg-[#050505]) y texto blanco (dark:text-white)
      */}
      <body className="bg-zinc-50 text-zinc-900 dark:bg-[#050505] dark:text-white antialiased transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Arranca por defecto en el modo oscuro premium de tu diseño
          enableSystem
          disableTransitionOnChange
        >
          <PrivyClientProvider>
            {children}
          </PrivyClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}