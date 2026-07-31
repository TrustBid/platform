/**
 * Facturación es la única pestaña del diseño que sigue sin backend.
 *
 * No es un endpoint que falte: no existe el dominio. La tabla `plans` guarda
 * planes de trabajo (fechas, programa), no suscripciones — no hay precios,
 * límites por plan, historial de cobros ni pasarela de pago. Construirlo
 * requiere decisiones de producto, no sólo código, así que la pantalla queda
 * fuera de la navegación hasta que existan.
 *
 * El componente `BillingTab` se conserva para no rehacer el trabajo de diseño.
 */
export const SETTINGS_TABS_ENABLED = {
  billing: false,
} as const;
