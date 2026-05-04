type ProductT = (key: string) => string;

export type RequiresBuildLabels = {
  badge: string;
  title: string;
  body: string;
  contactCta: string;
  configureCta: string;
  close: string;
};

export function buildRequiresBuildLabels(t: ProductT): RequiresBuildLabels {
  return {
    badge: t("requiresBuildBadge"),
    title: t("requiresBuildTitle"),
    body: t("requiresBuildBody"),
    contactCta: t("requiresBuildContactCta"),
    configureCta: t("requiresBuildConfigureCta"),
    close: t("requiresBuildClose"),
  };
}
