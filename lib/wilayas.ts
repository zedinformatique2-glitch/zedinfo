import { WILAYAS_BILINGUAL, getCommunesForWilaya } from "./wilayas-communes";
export { WILAYAS_BILINGUAL, getCommunesForWilaya };
export type { Commune } from "./wilayas-communes";

// 69 wilayas of Algeria (French names, kept for backwards compat)
export const WILAYAS = WILAYAS_BILINGUAL.map((w) => w.fr);

export function getShippingCost(_wilaya: string): number {
  // Flat rate for now; admin can replace later
  return 800;
}

// Entries 59-69 of WILAYAS_BILINGUAL are daïras the shop lists as if they were
// wilayas. Their index yields codes 59-69, which no carrier recognises, so fee
// lookups silently fell back to the flat rate above. Map them to the official
// code of the wilaya they actually belong to.
const DAIRA_TO_WILAYA_CODE: Record<string, number> = {
  Aflou: 3, // Laghouat
  "El Abiodh Sidi Cheikh": 32, // El Bayadh
  "El Aricha": 13, // Tlemcen
  "El Kantara": 7, // Biskra
  Barika: 5, // Batna
  "Bou Saâda": 28, // M'Sila
  "Bir El Ater": 12, // Tébessa
  "Ksar El Boukhari": 26, // Médéa
  "Ksar Chellala": 14, // Tiaret
  "Aïn Oussara": 17, // Djelfa
  "M'saâd": 17, // Djelfa
};

/** Get the official 1-58 wilaya number from a French name in WILAYAS_BILINGUAL. */
export function getWilayaNumber(wilayaFr: string): number {
  const mapped = DAIRA_TO_WILAYA_CODE[wilayaFr];
  if (mapped) return mapped;
  const idx = WILAYAS_BILINGUAL.findIndex((w) => w.fr === wilayaFr);
  return idx >= 0 ? idx + 1 : 0;
}
