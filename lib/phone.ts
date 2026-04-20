// Algerian mobile: 10 digits starting with 05, 06, or 07
// Accepts input with spaces/dashes/dots and strips them before validation.

export function normalizeDzPhone(input: string): string {
  return (input || "").replace(/[\s\-.()]/g, "");
}

export function isValidDzMobile(input: string): boolean {
  const n = normalizeDzPhone(input);
  return /^0[567]\d{8}$/.test(n);
}

export const DZ_PHONE_ERROR = {
  fr: "Numéro invalide — commence par 05, 06 ou 07 (10 chiffres)",
  ar: "رقم غير صحيح — يبدأ بـ 05 أو 06 أو 07 (10 أرقام)",
  en: "Invalid number — must start with 05, 06 or 07 (10 digits)",
};
