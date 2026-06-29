'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Shield, User, Wallet } from 'lucide-react';
import { demoUser } from '@/lib/demo-user';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">

      {/* Header Principal */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Gestiona tu cuenta, credenciales de administrador y preferencias de la red.</p>
        </div>
        <ModeToggle />
      </div>

      {/* Bloque 1: Perfil del Administrador */}
      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Información del Perfil</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Tus datos de identidad dentro de la plataforma.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Fila de la foto/avatar actual */}
          <div className="flex items-center gap-4 bg-zinc-100/60 border border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800/40 p-4 rounded-xl">
            <Avatar className="h-14 w-14 border border-zinc-300 dark:border-zinc-700/50">
              <AvatarFallback className="bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-sm font-bold">DC</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{demoUser.name}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-500">Administrador de la dApp</p>
            </div>
            <Button variant="outline" className="ml-auto h-9 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Cambiar foto
            </Button>
          </div>

          {/* Formulario en Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nombre completo</label>
              <Input defaultValue={demoUser.name} className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700 focus:ring-0" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Correo electrónico</label>
              <Input defaultValue={demoUser.email} disabled className="bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Teléfono</label>
              <Input placeholder="+54 11 ..." className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Organización / Entidad</label>
              <Input placeholder="TrustBid Org" className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloque 2: Infraestructura Web3 / Llaves */}
      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="p-2 bg-zinc-100 text-emerald-600 dark:bg-zinc-900 dark:text-emerald-500 rounded-lg">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Conexión de Billetera y Firmas</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Configuración de claves y wallets autorizadas para la Testnet.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-100/60 border border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800/60">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Freighter Wallet</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-0.5">Llave pública conectada para autorizar hitos on-chain.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 dark:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 px-2 py-1 rounded">
                GABC...3XYZ
              </span>
              <Button variant="outline" className="h-9 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Desconectar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloque 3: Seguridad de la Cuenta */}
      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="p-2 bg-zinc-100 text-amber-600 dark:bg-zinc-900 dark:text-amber-500 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Seguridad de Acceso</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Actualiza tus contraseñas de sesión.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Button variant="outline" className="h-9 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Botón de Guardado Global */}
      <div className="flex justify-end pt-4">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg transition-colors">
          Guardar todos los cambios
        </Button>
      </div>

    </div>
  );
}
