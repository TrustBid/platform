'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { FolderOpen, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  
  // Estado para controlar la apertura del modal centrado
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Estados del formulario para la conversión automática de XLM
  const [xlmAmount, setXlmAmount] = useState('');
  const [usdConversion, setUsdConversion] = useState('0.00');
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);

  const handleXlmChange = (val: string) => {
    setXlmAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setUsdConversion((num * 0.12).toFixed(2));
    } else {
      setUsdConversion('0.00');
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Proyecto registrado:', { xlmAmount, blockchainEnabled });
    setIsFormOpen(false); // Cierra el modal al guardar
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">
      
      {/* Header original */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Projects</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Manage your fund management projects</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
          <ModeToggle />
        </div>
      </div>

      {/* Contenedor Principal / Estado Vacío */}
      {projects.length === 0 ? (
        <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 py-24 px-4 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <div className="p-4 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-500 dark:border-blue-900/30 rounded-2xl mb-5">
            <FolderOpen className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">No projects yet</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 max-w-sm mt-1 mb-6">
            Create your first project to start tracking funds transparently
          </p>

          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            onClick={() => setIsFormOpen(true)}
          >
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <p className="text-zinc-600 dark:text-zinc-400">Proyectos activos...</p>
        </div>
      )}

      {/* --- FORMULARIO EN MODAL FLOTANTE CENTRADO (DIALOG) --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        {/* max-w-2xl le da el ancho expansivo ideal para ver las tarjetas completas en el centro */}
        <DialogContent className="w-full sm:max-w-2xl bg-[#fafafa] border border-zinc-200 text-zinc-950 max-h-[90vh] overflow-y-auto p-6 space-y-6 rounded-xl shadow-lg">
          
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">Create New Project</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Set up a new fund management project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-5">
            
            {/* Bloque 1: Detalles */}
            <Card className="bg-white border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-zinc-900">Detalles del proyecto</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Informacion basica del proyecto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Nombre del proyecto *</label>
                  <Input placeholder="Ej. Construccion escuela Fase 1" required className="border-zinc-300 bg-white text-zinc-900 h-9" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">Descripción</label>
                  <Textarea placeholder="Describe el alcance y objetivos..." className="border-zinc-300 bg-white text-zinc-900 min-h-[80px]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Beneficiario</label>
                    <Input placeholder="Ej. Comunidad de San Pedro" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Categoría</label>
                    <Select>
                      <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9">
                        <SelectValue placeholder="Seleccionar categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="environment">Environment</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 2: Presupuesto */}
            <Card className="bg-white border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-zinc-900">Presupuesto y cronograma</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Asignacion financiera y fechas del proyecto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">Presupuesto total (XLM) *</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={xlmAmount}
                      onChange={(e) => handleXlmChange(e.target.value)}
                      required 
                      className="border-zinc-300 bg-white text-zinc-900 h-9" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Conversion USD</label>
                    <Input type="text" disabled value={usdConversion} className="border-zinc-200 bg-zinc-50 text-zinc-500 h-9 font-medium" />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium italic">Tipo de cambio estimado: 1 XLM = 0.12 USD</p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Fecha de inicio</label>
                    <Input type="date" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Fecha de fin</label>
                    <Input type="date" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloque 3: Blockchain */}
            <Card className="bg-white border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-zinc-900">Blockchain</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Habilitar verificacion en Stellar blockchain</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-4 bg-zinc-50/50 rounded-b-xl border-t border-zinc-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-800">Habilitar verificacion blockchain</p>
                  <p className="text-[11px] text-zinc-400 max-w-[340px]">Registrar hashes de transacciones en Stellar Testnet para transparencia</p>
                </div>
                <Switch 
                  checked={blockchainEnabled} 
                  onCheckedChange={setBlockchainEnabled}
                  className="data-[state=checked]:bg-blue-600"
                />
              </CardContent>
            </Card>

            {/* Acciones del Formulario */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 font-medium text-xs h-9 px-4"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-5 shadow-sm"
              >
                Crear proyecto
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}