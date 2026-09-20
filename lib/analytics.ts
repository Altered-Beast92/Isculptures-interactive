'use client';
import { track as vercelTrack } from '@vercel/analytics';

type Event = 'enquiry_started' | 'enquiry_submitted' | 'enquiry_error' | 'contact_click';

export function track(event: Event, route?: string) {
  const detail = { event, ...(route ? { enquiry_type: route } : {}) };
  const target = window as Window & { dataLayer?: Record<string, unknown>[]; clarity?: (...args: unknown[]) => void };
  // Retained so a tag manager can be dropped in later without touching call sites.
  target.dataLayer?.push(detail);
  // Custom events are a paid Vercel Analytics feature; on Hobby this is a no-op and
  // page views still record, so Clarity below is what proves the funnel for now.
  vercelTrack(event, route ? { enquiry_type: route } : undefined);
  target.clarity?.('event', event);
  window.dispatchEvent(new CustomEvent('isculptures:analytics', { detail }));
}
