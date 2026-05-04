import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://www.zed-informatique.com"
  );
}

export const SITE_NAME = "ZED INFORMATIQUE";
export const SITE_PHONE = "+213663287772";
export const SITE_AREA = "Algeria";
export const DEFAULT_OG_IMAGE = "/hero1.webp";
export const SITE_LOGO = "/logo.jpg";

export function buildAlternates(locale: Locale, path: string) {
  const base = siteUrl();
  const normalized = path.startsWith("/") || path === "" ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${base}/${l}${normalized}`;
  }
  languages["x-default"] = `${base}/${defaultLocale}${normalized}`;
  return {
    canonical: `${base}/${locale}${normalized}`,
    languages,
  };
}

export function absUrl(path: string) {
  const base = siteUrl();
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

type LocaleCopy = { title: string; description: string };

export const HOME_SEO: Record<Locale, LocaleCopy> = {
  fr: {
    title: "PC Gamer, Composants & Configurateur PC en Algérie",
    description:
      "Boutique informatique en Algérie : cartes graphiques (RTX, Radeon), processeurs Intel & AMD, RAM DDR5, SSD NVMe, PC gamer pré-assemblés et configurateur PC sur mesure. Livraison 58 wilayas, paiement à la livraison.",
  },
  ar: {
    title: "بطاقات الرسوميات، المعالجات وتجميع الكمبيوتر في الجزائر",
    description:
      "متجر إلكترونيات في الجزائر: بطاقات رسوميات (RTX، Radeon)، معالجات Intel و AMD، ذاكرة DDR5، أقراص SSD NVMe، أجهزة كمبيوتر مجمّعة للألعاب وتكوين كمبيوتر حسب الطلب. توصيل لـ 58 ولاية والدفع عند الاستلام.",
  },
  en: {
    title: "Gaming PCs, PC Parts & Custom PC Builder in Algeria",
    description:
      "Algeria-based PC store: graphics cards (RTX, Radeon), Intel & AMD processors, DDR5 RAM, NVMe SSDs, pre-built gaming PCs, and custom PC configurator. Delivery to all 58 wilayas, cash on delivery.",
  },
};

export const CATEGORY_SEO: Record<string, Record<Locale, LocaleCopy>> = {
  "graphics-cards": {
    fr: {
      title: "Cartes graphiques (GPU) — RTX, Radeon",
      description:
        "Cartes graphiques NVIDIA GeForce RTX (4060, 4070, 4080, 4090) et AMD Radeon RX en Algérie. Comparez prix, VRAM et performance. Livraison 58 wilayas, paiement à la livraison.",
    },
    ar: {
      title: "بطاقات الرسوميات (GPU) — RTX و Radeon",
      description:
        "بطاقات رسوميات NVIDIA GeForce RTX (4060، 4070، 4080، 4090) و AMD Radeon RX في الجزائر. قارن الأسعار وذاكرة VRAM والأداء. توصيل لـ 58 ولاية والدفع عند الاستلام.",
    },
    en: {
      title: "Graphics Cards (GPU) — RTX & Radeon in Algeria",
      description:
        "NVIDIA GeForce RTX (4060, 4070, 4080, 4090) and AMD Radeon RX graphics cards in Algeria. Compare prices, VRAM and gaming performance. Delivery to 58 wilayas, cash on delivery.",
    },
  },
  processors: {
    fr: {
      title: "Processeurs CPU Intel & AMD",
      description:
        "Processeurs Intel Core (i5, i7, i9) et AMD Ryzen (5, 7, 9) — sockets LGA1700, AM5. Pour gaming, streaming et stations de travail. Livraison en Algérie.",
    },
    ar: {
      title: "المعالجات Intel و AMD",
      description:
        "معالجات Intel Core (i5، i7، i9) و AMD Ryzen (5، 7، 9) — مقابس LGA1700، AM5. للألعاب والبث ومحطات العمل. توصيل في الجزائر.",
    },
    en: {
      title: "CPU Processors — Intel & AMD",
      description:
        "Intel Core (i5, i7, i9) and AMD Ryzen (5, 7, 9) processors — LGA1700, AM5 sockets. For gaming, streaming and workstations. Delivered in Algeria.",
    },
  },
  ram: {
    fr: {
      title: "Mémoire RAM DDR4 & DDR5",
      description:
        "Barrettes de RAM DDR4 et DDR5 (16Go, 32Go, 64Go) — Corsair, G.Skill, Kingston. Compatibles AM5, LGA1700. Livraison rapide en Algérie.",
    },
    ar: {
      title: "ذاكرة RAM DDR4 و DDR5",
      description:
        "ذاكرة RAM DDR4 و DDR5 (16، 32، 64 جيجا) — Corsair، G.Skill، Kingston. متوافقة مع AM5 و LGA1700. توصيل سريع في الجزائر.",
    },
    en: {
      title: "RAM Memory — DDR4 & DDR5",
      description:
        "DDR4 and DDR5 RAM kits (16GB, 32GB, 64GB) — Corsair, G.Skill, Kingston. Compatible with AM5, LGA1700. Fast delivery across Algeria.",
    },
  },
  motherboards: {
    fr: {
      title: "Cartes mères Intel & AMD",
      description:
        "Cartes mères ATX, mATX et ITX — chipsets Z790, B760, X670, B650 pour Intel LGA1700 et AMD AM5. ASUS ROG, MSI MAG, Gigabyte. Livraison Algérie.",
    },
    ar: {
      title: "اللوحات الأم Intel و AMD",
      description:
        "لوحات أم ATX، mATX و ITX — شرائح Z790، B760، X670، B650 لمنصات Intel LGA1700 و AMD AM5. ASUS ROG، MSI MAG، Gigabyte. توصيل في الجزائر.",
    },
    en: {
      title: "Motherboards — Intel & AMD",
      description:
        "ATX, mATX and ITX motherboards — Z790, B760, X670, B650 chipsets for Intel LGA1700 and AMD AM5. ASUS ROG, MSI MAG, Gigabyte. Delivered in Algeria.",
    },
  },
  ssds: {
    fr: {
      title: "SSD NVMe & SATA",
      description:
        "Disques SSD NVMe M.2 et SATA (500Go, 1To, 2To, 4To) — Samsung, WD, Crucial. Lecture jusqu'à 7000 Mo/s. Livraison en Algérie.",
    },
    ar: {
      title: "أقراص SSD NVMe و SATA",
      description:
        "أقراص SSD NVMe M.2 و SATA (500، 1، 2، 4 تيرا) — Samsung، WD، Crucial. سرعة قراءة تصل إلى 7000 ميجابايت/ث. توصيل في الجزائر.",
    },
    en: {
      title: "SSD Storage — NVMe & SATA",
      description:
        "NVMe M.2 and SATA SSDs (500GB, 1TB, 2TB, 4TB) — Samsung, WD, Crucial. Read speeds up to 7000 MB/s. Delivered in Algeria.",
    },
  },
  "power-supplies": {
    fr: {
      title: "Alimentations PC (PSU) 80+ Gold",
      description:
        "Alimentations 80+ Bronze, Gold et Platinum (550W à 1200W) — Corsair, Seasonic, EVGA. Modulaires et ATX 3.0 / PCIe 5.0. Livraison Algérie.",
    },
    ar: {
      title: "مزودات الطاقة PC (PSU) 80+ Gold",
      description:
        "مزودات طاقة 80+ Bronze، Gold و Platinum (550 إلى 1200 واط) — Corsair، Seasonic، EVGA. نمطية و ATX 3.0 / PCIe 5.0. توصيل في الجزائر.",
    },
    en: {
      title: "Power Supplies (PSU) — 80+ Gold",
      description:
        "80+ Bronze, Gold and Platinum power supplies (550W to 1200W) — Corsair, Seasonic, EVGA. Modular, ATX 3.0 / PCIe 5.0 ready. Delivered in Algeria.",
    },
  },
  cases: {
    fr: {
      title: "Boîtiers PC ATX, mATX & ITX",
      description:
        "Boîtiers PC ATX mid-tower, full-tower et ITX — Lian Li, NZXT, Corsair, Cooler Master. Verre trempé, mesh, support GPU vertical. Livraison Algérie.",
    },
    ar: {
      title: "صناديق PC ATX، mATX و ITX",
      description:
        "صناديق كمبيوتر ATX و full-tower و ITX — Lian Li، NZXT، Corsair، Cooler Master. زجاج مقوى، شبكي، دعم GPU عمودي. توصيل في الجزائر.",
    },
    en: {
      title: "PC Cases — ATX, mATX & ITX",
      description:
        "ATX mid-tower, full-tower and ITX PC cases — Lian Li, NZXT, Corsair, Cooler Master. Tempered glass, mesh, vertical GPU support. Delivered in Algeria.",
    },
  },
  "cpu-cooling": {
    fr: {
      title: "Refroidissement CPU — AIO & Air",
      description:
        "Refroidissement CPU à eau (AIO 240, 280, 360 mm) et air (Noctua, be quiet!). Compatibles AM5, LGA1700. Livraison Algérie.",
    },
    ar: {
      title: "تبريد المعالج — AIO وهوائي",
      description:
        "تبريد المعالج مائي (AIO 240، 280، 360 ملم) وهوائي (Noctua، be quiet!). متوافق مع AM5 و LGA1700. توصيل في الجزائر.",
    },
    en: {
      title: "CPU Cooling — AIO & Air",
      description:
        "CPU liquid cooling (AIO 240, 280, 360 mm) and air coolers (Noctua, be quiet!). Compatible with AM5, LGA1700. Delivered in Algeria.",
    },
  },
  monitors: {
    fr: {
      title: "Moniteurs Gaming & Bureau",
      description:
        "Écrans 24, 27 et 32 pouces — 144Hz, 165Hz, 240Hz, 4K, IPS, OLED. Pour gaming, design et bureautique. Livraison en Algérie.",
    },
    ar: {
      title: "شاشات الألعاب والمكتب",
      description:
        "شاشات 24، 27 و 32 إنش — 144 و 165 و 240 هرتز، 4K، IPS، OLED. للألعاب والتصميم والمكتب. توصيل في الجزائر.",
    },
    en: {
      title: "Monitors — Gaming & Office",
      description:
        "24, 27 and 32-inch monitors — 144Hz, 165Hz, 240Hz, 4K, IPS, OLED. For gaming, design and office. Delivered in Algeria.",
    },
  },
  keyboards: {
    fr: {
      title: "Claviers Gaming & Mécaniques",
      description:
        "Claviers mécaniques, optiques et hot-swap — Logitech, Razer, Corsair, Keychron. Switches Cherry MX, RGB. Livraison en Algérie.",
    },
    ar: {
      title: "لوحات المفاتيح للألعاب والميكانيكية",
      description:
        "لوحات مفاتيح ميكانيكية وضوئية و hot-swap — Logitech، Razer، Corsair، Keychron. مفاتيح Cherry MX و RGB. توصيل في الجزائر.",
    },
    en: {
      title: "Keyboards — Gaming & Mechanical",
      description:
        "Mechanical, optical and hot-swap keyboards — Logitech, Razer, Corsair, Keychron. Cherry MX switches, RGB. Delivered in Algeria.",
    },
  },
  mice: {
    fr: {
      title: "Souris Gaming sans fil & filaires",
      description:
        "Souris gaming Logitech, Razer, SteelSeries, Glorious — capteurs jusqu'à 30000 DPI, sans fil et filaires. Livraison Algérie.",
    },
    ar: {
      title: "فأرات الألعاب لاسلكية وسلكية",
      description:
        "فأرات ألعاب Logitech، Razer، SteelSeries، Glorious — حساسات تصل إلى 30000 DPI، لاسلكية وسلكية. توصيل في الجزائر.",
    },
    en: {
      title: "Gaming Mice — Wireless & Wired",
      description:
        "Logitech, Razer, SteelSeries, Glorious gaming mice — sensors up to 30000 DPI, wireless and wired. Delivered in Algeria.",
    },
  },
  headsets: {
    fr: {
      title: "Casques Gaming & Écouteurs",
      description:
        "Casques gaming sans fil et filaires — HyperX, SteelSeries, Logitech, Razer. Surround 7.1, micro détachable. Livraison Algérie.",
    },
    ar: {
      title: "سماعات الألعاب",
      description:
        "سماعات ألعاب لاسلكية وسلكية — HyperX، SteelSeries، Logitech، Razer. صوت محيطي 7.1 وميكروفون قابل للفصل. توصيل في الجزائر.",
    },
    en: {
      title: "Gaming Headsets & Earphones",
      description:
        "Wireless and wired gaming headsets — HyperX, SteelSeries, Logitech, Razer. 7.1 surround, detachable mic. Delivered in Algeria.",
    },
  },
  "gaming-desktops": {
    fr: {
      title: "PC Gamer Pré-Assemblés",
      description:
        "PC gamer prêts à jouer avec RTX 4060, 4070, 4080. Configurations RGB, refroidissement liquide, garantie. Livraison en Algérie.",
    },
    ar: {
      title: "أجهزة كمبيوتر للألعاب جاهزة",
      description:
        "أجهزة كمبيوتر للألعاب مجمّعة مع RTX 4060، 4070، 4080. تكوينات RGB، تبريد مائي، ضمان. توصيل في الجزائر.",
    },
    en: {
      title: "Pre-Built Gaming PCs",
      description:
        "Ready-to-play gaming PCs with RTX 4060, 4070, 4080. RGB builds, liquid cooling, warranty. Delivered in Algeria.",
    },
  },
  "laptops-notebooks": {
    fr: {
      title: "Ordinateurs portables & Notebooks",
      description:
        "Ordinateurs portables gaming et bureautique — ASUS, MSI, HP, Lenovo, Dell. Avec RTX, Ryzen, Intel Core. Livraison Algérie.",
    },
    ar: {
      title: "أجهزة الكمبيوتر المحمولة و Notebooks",
      description:
        "أجهزة كمبيوتر محمولة للألعاب والمكتب — ASUS، MSI، HP، Lenovo، Dell. مع RTX، Ryzen، Intel Core. توصيل في الجزائر.",
    },
    en: {
      title: "Laptops & Notebooks",
      description:
        "Gaming and office laptops — ASUS, MSI, HP, Lenovo, Dell. With RTX, Ryzen, Intel Core. Delivered in Algeria.",
    },
  },
  "gaming-chairs": {
    fr: {
      title: "Chaises Gaming Ergonomiques",
      description:
        "Chaises gaming ergonomiques avec support lombaire — DXRacer, Secretlab, Corsair. Confort longue durée. Livraison en Algérie.",
    },
    ar: {
      title: "كراسي الألعاب المريحة",
      description:
        "كراسي ألعاب مريحة مع دعم أسفل الظهر — DXRacer، Secretlab، Corsair. راحة طويلة الأمد. توصيل في الجزائر.",
    },
    en: {
      title: "Gaming Chairs — Ergonomic",
      description:
        "Ergonomic gaming chairs with lumbar support — DXRacer, Secretlab, Corsair. Long-session comfort. Delivered in Algeria.",
    },
  },
  "modems-routers": {
    fr: {
      title: "Modems & Routeurs WiFi 6",
      description:
        "Routeurs WiFi 6 et 6E, modems 4G/5G — TP-Link, ASUS, Netgear. Pour fibre Algérie Télécom et 4G. Livraison en Algérie.",
    },
    ar: {
      title: "مودم وراوتر WiFi 6",
      description:
        "راوتر WiFi 6 و 6E، مودم 4G/5G — TP-Link، ASUS، Netgear. متوافق مع ألياف اتصالات الجزائر و 4G. توصيل في الجزائر.",
    },
    en: {
      title: "Modems & WiFi 6 Routers",
      description:
        "WiFi 6 and 6E routers, 4G/5G modems — TP-Link, ASUS, Netgear. Works with Algérie Télécom fibre and 4G. Delivered in Algeria.",
    },
  },
};

export function categorySeo(slug: string, locale: Locale): LocaleCopy | null {
  return CATEGORY_SEO[slug]?.[locale] ?? null;
}
