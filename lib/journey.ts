import type { Property } from "./model";
import { addDays } from "./operations";
export function registrationComplete(p: Property) {
  return Boolean(
    p.name.trim() &&
    p.address.trim() &&
    (p.ownerName || p.client).trim() &&
    p.contactName?.trim() &&
    (p.contactEmail?.trim() || p.contactPhone?.trim()),
  );
}
export function weeklyDates(first: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(first) ||
    !Number.isFinite(Date.parse(first + "T12:00:00Z"))
  )
    throw Error("Choose a valid first inspection date.");
  return Array.from({ length: 4 }, (_, i) => addDays(first, i * 7));
}
