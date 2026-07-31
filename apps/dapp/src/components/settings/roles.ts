/** Etiquetas de rol visibles al usuario. Las claves son los roles del backend. */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  contador: 'Contador',
  responsable: 'Resp. de Área',
  auditor: 'Auditor',
  donante: 'Donante',
};

/** Descripción de permisos por rol — tabla "Permisos por rol". */
export const ROLE_PERMISSIONS: { role: string; detail: string }[] = [
  {
    role: 'Administrador',
    detail: 'Todo — proyectos, áreas, usuarios, reportes, desembolsos',
  },
  {
    role: 'Contador',
    detail: 'Valida facturas, genera reportes, audita movimientos',
  },
  {
    role: 'Resp. de Área',
    detail: 'Registra gastos en su área — no ve otras áreas',
  },
  {
    role: 'Auditor (solo lectura)',
    detail: 'Lee todos los movimientos y reportes — no puede editar',
  },
];
