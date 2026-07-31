/**
 * Pestañas de Configuración que existen en el diseño pero todavía no tienen
 * API detrás. Se mantienen los componentes en el repo —ya están hechos y
 * revisados contra Figma— pero no se muestran, para no exponer datos
 * inventados como si fueran reales.
 *
 * Para habilitar una, poné su flag en `true` una vez que el endpoint exista:
 *
 * | Pestaña       | Qué falta                                                    |
 * |---------------|--------------------------------------------------------------|
 * | areas         | CRUD de `areas` + columnas de presupuesto (la tabla no las tiene) |
 * | templates     | CRUD sobre `pipeline_templates` / `pipeline_template_stages` |
 * | notifications | Tabla de preferencias por usuario/evento/canal                |
 * | billing       | Dominio de suscripciones completo (`plans` son planes de       |
 * |               | trabajo, no de cobro)                                         |
 */
export const SETTINGS_TABS_ENABLED = {
  areas: false,
  templates: false,
  notifications: false,
  billing: false,
} as const;
