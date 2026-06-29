import React from 'react';
import { AppSidebar } from '@/components/shared/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { demoUser } from '@/lib/demo-user';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* 
        Usamos 'bg-background' y 'text-foreground'. 
        Gracias a tu globals.css, esto va a mutar automáticamente 
        entre blanco oklch(1 0 0) y negro oklch(0.145 0 0) en toda la parte derecha.
      */}
      <div className="flex min-h-screen w-screen bg-background text-foreground transition-colors duration-200 relative">
        
        {/* Barra Lateral Izquierda (Se mantiene fija oscura por sus estilos propios) */}
        <AppSidebar userName={demoUser.name} userEmail={demoUser.email} />

        {/* Contenedor del Contenido Derecho */}
        <div className="flex flex-1 flex-col relative bg-background">

          {/* Vistas dinámicas (Projects, Reports, etc.) */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}