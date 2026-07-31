/**
 * Roles del enum `user_role` de la base.
 *
 * El diseño también muestra "Contador" y "Auditor", pero no existen como rol ni
 * tienen permisos implementados: darlos de alta sin eso les concedería
 * escritura sobre todo endpoint que no esté marcado @Roles('admin') en la API.
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  responsable: 'Resp. de Área',
  donante: 'Donante',
};

/** Opciones asignables desde el diálogo de edición de usuario. */
export const ASSIGNABLE_ROLES = Object.entries(ROLE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/** Qué puede hacer cada rol — tabla "Permisos por rol". */
export const ROLE_PERMISSIONS: { role: string; detail: string }[] = [
  {
    role: 'Administrador',
    detail: 'Todo — proyectos, áreas, usuarios, reportes, desembolsos',
  },
  {
    role: 'Resp. de Área',
    detail: 'Registra gastos y da seguimiento a los proyectos de la organización',
  },
  {
    role: 'Donante',
    detail: 'Consulta los proyectos que financia y verifica su ejecución',
  },
];
