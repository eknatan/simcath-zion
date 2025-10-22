// Small helper to translate validation messages coming from Zod
// It normalizes messages like "validation.required" to the validation namespace
// and falls back to the raw message if no key is detected.

export type Translator = (key: string, values?: Record<string, string | number | Date>) => string;

export function translateValidationMessage(
  tValidation: Translator,
  message?: unknown
): string {
  if (!message) return '';
  const raw = String(message);

  // Support inline params format: "validation.minLength|min=2|max=100"
  let msg = raw;
  let values: Record<string, string | number | Date> | undefined;
  if (raw.includes('|')) {
    const [key, ...pairs] = raw.split('|');
    msg = key;
    values = pairs.reduce<Record<string, string | number | Date>>((acc, part) => {
      const [k, v] = part.split('=');
      if (k && v) acc[k] = Number.isNaN(Number(v)) ? v : Number(v);
      return acc;
    }, {});
  }

  // If the message already includes the namespace, strip it
  if (msg.startsWith('validation.')) {
    return tValidation(msg.slice('validation.'.length), values);
  }

  // Known Zod default messages mapping (best-effort fallback)
  const lower = msg.toLowerCase();
  if (lower.includes('expected number') || lower.includes('received nan')) {
    return tValidation('invalidNumber');
  }
  if (lower.includes('required')) {
    return tValidation('required');
  }
  if (lower.includes('email')) {
    return tValidation('invalidEmail');
  }

  // Fallback to raw message when we don't recognize it
  return raw;
}
