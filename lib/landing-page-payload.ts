// Turns the landing-page admin form into the saved page fields. The form has
// one input per text (written in Arabic); it is mirrored into both the FR and
// AR fields. Used for saving and for the live preview, so both always match.

export type LandingFormState = {
  productId: string;
  headline: string;
  subheadline: string;
  bullets: string; // one benefit per line
  cta: string;
  priceOverrideDzd: string;
  comparePriceDzd: string;
  enabled: boolean;
  heroImage: string;
  description: string;
  urgency: string;
  guarantee: string;
  scarcity: string;
  defaultLang: string;
  showCountdown: boolean;
  countdownEndsAt: string; // datetime-local value
  showStockUrgency: boolean;
  primaryColor: string;
  accentColor: string;
};

const optStr = (s: string) => (s.trim() ? s : undefined);
const splitLines = (s: string) => s.split("\n").map((v) => v.trim()).filter(Boolean);

export function buildLandingPayload(s: LandingFormState, slug: string) {
  const bullets = splitLines(s.bullets);
  return {
    slug,
    productId: s.productId,
    headlineFr: s.headline,
    headlineAr: s.headline,
    subheadlineFr: s.subheadline,
    subheadlineAr: s.subheadline,
    bulletsFr: bullets,
    bulletsAr: bullets,
    descriptionFr: optStr(s.description),
    descriptionAr: optStr(s.description),
    heroImage: s.heroImage.trim() || undefined,
    priceOverrideDzd: s.priceOverrideDzd ? Number(s.priceOverrideDzd) : undefined,
    comparePriceDzd: s.comparePriceDzd ? Number(s.comparePriceDzd) : undefined,
    ctaFr: s.cta,
    ctaAr: s.cta,
    urgencyTextFr: optStr(s.urgency),
    urgencyTextAr: optStr(s.urgency),
    guaranteeTextFr: optStr(s.guarantee),
    guaranteeTextAr: optStr(s.guarantee),
    scarcityTextFr: optStr(s.scarcity),
    scarcityTextAr: optStr(s.scarcity),
    primaryColor: optStr(s.primaryColor),
    accentColor: optStr(s.accentColor),
    defaultLang: optStr(s.defaultLang),
    showCountdown: s.showCountdown,
    countdownEndsAt:
      s.showCountdown && s.countdownEndsAt ? new Date(s.countdownEndsAt).getTime() : undefined,
    showStockUrgency: s.showStockUrgency,
    enabled: s.enabled,
  };
}
