const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRecipients(input: string): string[] {
  const candidates = input
    .split(/[\n,]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const validRecipients = candidates.filter((email) =>
    EMAIL_REGEX.test(email)
  );

  return [...new Set(validRecipients)];
}