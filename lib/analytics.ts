'use client';
export function track(event: 'enquiry_started' | 'enquiry_submitted' | 'enquiry_error' | 'contact_click', route?: string) {
  const detail = { event, ...(route ? { enquiry_type: route } : {}) };
  // An integration hook only; no analytics provider or cookies are enabled here.
  const target = window as Window & { dataLayer?: Record<string, unknown>[] };
  target.dataLayer?.push(detail);
  window.dispatchEvent(new CustomEvent('isculptures:analytics', { detail }));
}
