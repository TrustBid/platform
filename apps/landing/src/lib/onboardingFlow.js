export const ONBOARDING_EVENT = 'trustbid:open-onboarding';

// options.startAtPlan — si se abre directo desde el card Free de Pricing
export function openOnboarding(options = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT, { detail: options }));
}
