/**
 * Numeric text-field helpers. Fields hold the text as typed; it is converted
 * only on save. An empty or invalid entry is an error — never silently 0.
 */
export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

export function parseRequiredNumber(text: string, min: number, max: number, label: string): ParseResult {
  const t = text.trim();
  if (t === '') return { ok: false, error: `Enter a ${label}.` };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, error: `${label} must be a number.` };
  if (n < min || n > max) return { ok: false, error: `${label} must be between ${min} and ${max}.` };
  return { ok: true, value: n };
}

/** Warning when a new useful life is less than half or more than double the shared default. */
export function bigLifeChangeWarning(newLife: number, defaultLife: number | undefined): string | null {
  if (!defaultLife || defaultLife <= 0) return null;
  if (newLife < defaultLife / 2 || newLife > defaultLife * 2) {
    return `That's a big change from the ${defaultLife}-year default — check it before saving.`;
  }
  return null;
}
