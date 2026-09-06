export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const EXTENSIONS = ['stl', 'obj', '3mf', 'pdf', 'png', 'jpg', 'jpeg'];
export const ROUTES = ['bulk', 'supply', 'design', 'file'] as const;
export type EnquiryRoute = typeof ROUTES[number];
export const CUSTOMER_TYPES = ['Business', 'Event planner / agency', 'Retailer / reseller', 'Parish / organisation', 'Private event', 'Other'];
export type Enquiry = {
  submissionId: string; route: EnquiryRoute; website: string; consent: boolean;
  contact: { name: string; email: string; company: string; phone: string; customerType: string };
  brief: string; quantity: number | null; annualQuantity: number | null; frequency: string;
  material: string; dimensions: string; finish: string; packaging: string; budget: string;
  requiredBy: string; deadlineFixed: boolean; postcode: string; destinations: string;
  notes: string; sourcePath: string; referrerHost: string;
  campaign: { source: string; medium: string; campaign: string };
};
export type Validation = { data?: Enquiry; errors: Record<string, string> };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
export function validateEnquiry(input: unknown): Validation {
  const value = object(input); const contact = object(value.contact); const campaign = object(value.campaign);
  const errors: Record<string, string> = {};
  const route = ROUTES.includes(value.route as EnquiryRoute) ? value.route as EnquiryRoute : 'bulk';
  if (!ROUTES.includes(value.route as EnquiryRoute)) errors.route = 'Choose an enquiry type.';
  const name = clean(contact.name, 200), email = clean(contact.email, 254), brief = clean(value.brief, 5000);
  if (!name) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!brief) errors.brief = 'Tell us what you would like to make.';
  const number = (key: string, minimum: number) => {
    if (value[key] === '' || value[key] === undefined || value[key] === null) return null;
    const result = typeof value[key] === 'number' || typeof value[key] === 'string' ? Number(value[key]) : NaN;
    if (!Number.isSafeInteger(result) || result < minimum || result > 10000000) { errors[key] = 'Enter a whole number of ' + minimum + ' or more, or leave it blank if unsure.'; return null; }
    return result;
  };
  const quantity = number('quantity', route === 'bulk' || route === 'supply' ? 10 : 1);
  const annualQuantity = number('annualQuantity', 1);
  const requiredBy = clean(value.requiredBy, 10);
  if (requiredBy && (!/^\d{4}-\d{2}-\d{2}$/.test(requiredBy) || Number.isNaN(Date.parse(requiredBy)) || new Date(requiredBy).toISOString().slice(0,10) !== requiredBy)) errors.requiredBy = 'Enter a valid delivery date.';
  if (value.consent !== true) errors.consent = 'Please acknowledge the privacy notice before sending.';
  const submissionId = clean(value.submissionId, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) errors.submissionId = 'Refresh the page and try again.';
  const data: Enquiry = {
    submissionId, route, website: clean(value.website, 200), consent: value.consent === true,
    contact: { name, email, company: clean(contact.company, 200), phone: clean(contact.phone, 40), customerType: clean(contact.customerType, 100) },
    brief, quantity, annualQuantity, frequency: clean(value.frequency, 200), material: clean(value.material, 200),
    dimensions: clean(value.dimensions, 500), finish: clean(value.finish, 500), packaging: clean(value.packaging, 500), budget: clean(value.budget, 100),
    requiredBy, deadlineFixed: value.deadlineFixed === true, postcode: clean(value.postcode, 100), destinations: clean(value.destinations, 500),
    notes: clean(value.notes, 3000), sourcePath: clean(value.sourcePath, 200), referrerHost: clean(value.referrerHost, 200),
    campaign: { source: clean(campaign.source, 100), medium: clean(campaign.medium, 100), campaign: clean(campaign.campaign, 100) }
  };
  return Object.keys(errors).length ? { errors } : { data, errors };
}
export function validateFiles(files: { name: string; size: number }[]): string | null {
  if (files.length > MAX_FILES) return 'Choose up to 5 files.';
  if (files.some(file => !EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() || ''))) return 'Use STL, OBJ, 3MF, PDF, PNG or JPG files.';
  if (files.some(file => !file.size || file.size > MAX_FILE_BYTES)) return 'Each file must contain data and be no larger than 10 MB.';
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_UPLOAD_BYTES) return 'Keep the combined file size under 20 MB.';
  return null;
}
