'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { FileText, Plus, ArrowRight, ArrowLeft, CheckCircle, Upload, Eye, BarChart2 } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  
  // Estado para controlar la apertura del modal del reporte
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Estado para manejar el paso actual del formulario (1 al 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Estados locales del formulario
  const [reportTitle, setReportTitle] = useState('');
  const [description, setDescription] = useState('');

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Reporte Creado:', { reportTitle, description });
    setIsFormOpen(false);
    setCurrentStep(1); // Resetea al primer paso para la próxima vez
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">
      
      {/* Header original de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Reports</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Track and audit project milestones and statements</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors"
            onClick={() => { setIsFormOpen(true); setCurrentStep(1); }}
          >
            <Plus className="h-4 w-4" />
            New Report
          </Button>
          <ModeToggle />
        </div>
      </div>

      {/* Estado Vacío Original */}
      {reports.length === 0 ? (
        <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 py-24 px-4 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <div className="p-4 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-500 dark:border-blue-900/30 rounded-2xl mb-5">
            <FileText className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">No reports yet</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 max-w-sm mt-1 mb-6">
            Create your first milestone or financial report to document project progress
          </p>

          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            onClick={() => { setIsFormOpen(true); setCurrentStep(1); }}
          >
            Create your first report
          </Button>
        </div>
      ) : (
        <div className="text-zinc-600 dark:text-zinc-400">Listado de reportes...</div>
      )}

      {/* --- FORMULARIO MULTI-PASO EN DIALOG CENTRADO --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        {/* max-w-4xl emula la amplitud horizontal que se ve en la captura de pantalla */}
        <DialogContent className="w-full sm:max-w-4xl bg-[#fafafa] border border-zinc-200 text-zinc-950 max-h-[95vh] overflow-y-auto p-8 rounded-xl shadow-lg space-y-6">
          
          {/* Encabezado dinámico según la captura */}
          <div className="flex flex-col gap-1 text-left border-b border-zinc-200/60 pb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span>Crear Reporte</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Crear Reporte</h2>
            <p className="text-xs text-zinc-400">Paso {currentStep} de 4</p>
          </div>

          {/* STEPPER VISUAL (Estructura idéntica a image_aef743.png) */}
          <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-4 py-2">
            {[
              { step: 1, label: 'Informacion', icon: FileText },
              { step: 2, label: 'Datos', icon: BarChart2 },
              { step: 3, label: 'Documentos', icon: Upload },
              { step: 4, label: 'Revision', icon: CheckCircle },
            ].map((item, index, arr) => {
              const IconComponent = item.icon;
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <React.Fragment key={item.step}>
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200' 
                        : isCompleted 
                        ? 'bg-blue-50 border-blue-300 text-blue-600' 
                        : 'bg-white border-zinc-200 text-zinc-400'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-semibold tracking-tight transition-colors ${
                      isActive ? 'text-zinc-900 font-bold' : isCompleted ? 'text-blue-600' : 'text-zinc-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div className={`h-[1px] flex-1 mx-4 transition-colors ${
                      currentStep > item.step ? 'bg-blue-300' : 'bg-zinc-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* CONTENIDO INTERNO DINÁMICO POR PASOS */}
          <div className="pt-4">
            {currentStep === 1 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4 border-b border-zinc-100">
                  <CardTitle className="text-base font-bold text-zinc-900">Informacion del reporte</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Proyecto *</label>
                      <Select>
                        <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9">
                          <SelectValue placeholder="Seleccionar proyecto" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                          <SelectItem value="p1">TrustBid Core Infrastructure</SelectItem>
                          <SelectItem value="p2">Escuela San Pedro Fase 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Tipo de reporte *</label>
                      <Select>
                        <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                          <SelectItem value="financial">Reporte Financiero</SelectItem>
                          <SelectItem value="milestone">Verificación de Hito</SelectItem>
                          <SelectItem value="audit">Auditoría Externa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Periodo desde *</label>
                      <Input type="date" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Periodo hasta *</label>
                      <Input type="date" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Titulo del reporte</label>
                    <Input 
                      placeholder="Ej. Reporte financiero Q1 2026" 
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="border-zinc-300 bg-white text-zinc-900 h-9" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Descripcion</label>
                    <Textarea 
                      placeholder="Descripcion breve del reporte..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border-zinc-300 bg-white text-zinc-900 min-h-[100px]" 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Métricas y Datos Financieros</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Montos ejecutados e hitos cubiertos en este ciclo</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Fondos Utilizados (XLM) *</label>
                      <Input type="number" placeholder="0.00" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Porcentaje de avance hito (%)</label>
                      <Input type="number" placeholder="Ej. 25" className="border-zinc-300 bg-white text-zinc-900 h-9" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Documentación de Respaldo</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Sube facturas, fotos de avance u otros comprobantes</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center flex flex-col items-center justify-center hover:bg-zinc-50/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-semibold text-zinc-800">Arrastra tus archivos aquí o haz clic para buscar</p>
                    <p className="text-xs text-zinc-400 mt-1">Soporta PDF, PNG, JPG (Máx 10MB)</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Revisión Final</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Verifica la integridad de los datos antes de guardarlo</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-2 text-sm text-zinc-700">
                    <p><strong>Título:</strong> {reportTitle || 'Sin título asignado'}</p>
                    <p><strong>Descripción:</strong> {description || 'Sin descripción aportada'}</p>
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 pt-1">
                      <Eye className="h-3.5 w-3.5" /> El reporte se guardará en base de datos local para auditoría.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* BOTONES DE NAVEGACIÓN INFERIOR */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 1}
              onClick={prevStep}
              className="border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 font-medium text-xs h-9 px-4 flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-5 flex items-center gap-1.5 shadow-sm"
              >
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateReport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-5 shadow-sm"
              >
                Emitir Reporte
              </Button>
            )}
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
}