// Event bus for the "Request access" modal. Any CTA can call openAccessModal()
// and the single <AccessModal /> mounted in App listens for it.
export const ACCESS_EVENT = 'trustbid:open-access';

// `detail.plan` (optional) shows which plan the visitor came from.
export function openAccessModal(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACCESS_EVENT, { detail }));
}
