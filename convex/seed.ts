import { mutation } from "./_generated/server";

// Placeholder Google CDN image — mockup hero
const IMG_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBzT4Dhkk2XoSssbyUC4dfthazowEJ4DFb1Un_z0xcXuD3kvzyxzdkP2fh37q_CsImjfujTvKkMcDLTVH4zQBTnLTVg_hhex15Lpu6CM-2ulGYrF99r7TzI7cES97D8TkWxpGeUY7ymYlK185MU9v2brY0lUpy8963jNSpzNorgfFgsKHvgQs-S4fVAdCWhn7qZO5y3WbfHgqUQI8NCs-WZkdjfbahMPO85mYTx9iHTyeKQQPfAtdvqiFlUOO_S3KNrjEQCjrNc-Gyg";
const IMG_GPU =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBG0n_aNrPfe8AhKqXaCNr639b1IplMZ5uc7CyzG_niwBWrJiRPnlf5z5LJeqiWKutYcDVPMXbCD_o1nGzyeL9yNh2VvdNcJtGcugpyR4Xi2NE3x3zys6b3-sDVY8cZp1bZqf6nKaCaQkqSsqij3PlqeV9vdGCAOJZFuiLDMFL85OixFekVq2kuwW_eOJypQsiAugEctiknI4cmHBCQ2sqOcHXRlHdfmlbTJYOSGjd5qsRLIpKSDwdAuVDVz0E6_xDpqsf5G7YDcn5b";
const IMG_CPU =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZB3_lvyNUM-5Bip5LKBK5zc9jyyCdxr7rR6vWlKx8KQfpmlKDwo44f-yImvcKahmJ3qIDhHp7w9pGKJACmxhh2c1mUzxhtQCER1QaixlXWk2MFcLIhCf8z5gkkLix2iZxT0Yjn2-LjIdMHatplZr4GCsKKcRAfwBaU6qSL7OmW_nV4MM-6rizJPA6vunLkkghs3oahqKkVKp-ElfEu6NKTEb_ZPqQUNQf3Rb1fXulEEJCGE-ZgtHFgP88GyLDao9CL2PajkIBWzFL";
const IMG_MOBO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDwL2c4LJNuXkcEUZHoo2mQKGuwETVTh6vfUWi57DlP-0wTDdgwB0e_rEuT-ZyMjTONXiKAuQBOjUqKSNlrp4PlMKy7UaKs3Thu-3YEZ-HMjuUXEG6hwuvle5a5kZigdQjNY6gwId0ta_6fAPulQ9QgXbpnSFuFfPEnsjphXxGP8BhWyzaWA6rxLjBQtMUndHtFHw1UomhX_-aLnoMEXsE_9CoBD9kOfqz8cBDlcICJKRLZKvSbgACP5pbUcxYHTw77-Co-uKTmdH_H";
const IMG_COOLER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAAfZP6OTe0qldzVqJylt_82kjnXqIvYhGr4-ZaZyBi8WLghjfvpeP11MQ-9nqic2BlXtbl2nMO4ReTuMQP11D2e_kv3opWZAgdZlYrMFs8UlD8VZ8OKCkpSafR4L1GSCJlZA7IKNYad8YlBIEScxjt-oBnY9M5T55ht-CP6MZcBLfZ56qkRIzHXEx907YQpmzQzVUUEREUmxBzGj6kE3tHunu_z1nTEiDFCWhbA-34mfkkmtSzRY_h-njBhcjQNO6oGJgXF1sjUE8p";

const HIERARCHY = [
  {
    slug: "pc-components", nameFr: "Composants PC", nameAr: "مكونات الكمبيوتر", icon: "memory", order: 1,
    children: [
      { slug: "processors", nameFr: "Processeurs", nameAr: "المعالجات", icon: "developer_board", order: 1 },
      { slug: "ram", nameFr: "Mémoire RAM", nameAr: "الذاكرة العشوائية", icon: "memory_alt", order: 2 },
      { slug: "motherboards", nameFr: "Cartes mères", nameAr: "اللوحات الأم", icon: "dashboard", order: 3 },
      { slug: "cpu-cooling", nameFr: "Refroidissement CPU", nameAr: "تبريد المعالج", icon: "ac_unit", order: 4 },
      { slug: "cases", nameFr: "Boîtiers", nameAr: "الصناديق", icon: "view_in_ar", order: 5 },
      { slug: "graphics-cards", nameFr: "Cartes graphiques", nameAr: "بطاقات الرسوميات", icon: "videocam", order: 6 },
      { slug: "power-supplies", nameFr: "Alimentations", nameAr: "مزودات الطاقة", icon: "bolt", order: 7 },
    ],
  },
  {
    slug: "storage-devices", nameFr: "Stockage", nameAr: "أجهزة التخزين", icon: "storage", order: 2,
    children: [
      { slug: "hard-drives", nameFr: "Disques durs", nameAr: "الأقراص الصلبة", icon: "hard_drive", order: 1 },
      { slug: "ssds", nameFr: "SSD", nameAr: "أقراص SSD", icon: "speed", order: 2 },
      { slug: "usb-flash-drives", nameFr: "Clés USB & cartes mémoire", nameAr: "فلاش USB وبطاقات الذاكرة", icon: "usb", order: 3 },
      { slug: "optical-drives", nameFr: "Lecteurs optiques", nameAr: "محركات الأقراص الضوئية", icon: "album", order: 4 },
    ],
  },
  {
    slug: "peripherals", nameFr: "Périphériques", nameAr: "الأجهزة الطرفية", icon: "monitor", order: 3,
    children: [
      { slug: "monitors", nameFr: "Moniteurs", nameAr: "الشاشات", icon: "monitor", order: 1 },
      { slug: "headsets", nameFr: "Casques & écouteurs", nameAr: "سماعات الرأس", icon: "headphones", order: 2 },
      { slug: "mice", nameFr: "Souris", nameAr: "الفأرات", icon: "mouse", order: 3 },
      { slug: "mouse-pads", nameFr: "Tapis de souris", nameAr: "لوحات الفأرة", icon: "grid_view", order: 4 },
      { slug: "keyboards", nameFr: "Claviers", nameAr: "لوحات المفاتيح", icon: "keyboard", order: 5 },
      { slug: "game-controllers", nameFr: "Manettes de jeu", nameAr: "أذرع التحكم", icon: "sports_esports", order: 6 },
      { slug: "microphones", nameFr: "Microphones", nameAr: "الميكروفونات", icon: "mic", order: 7 },
      { slug: "speakers", nameFr: "Haut-parleurs", nameAr: "مكبرات الصوت", icon: "speaker", order: 8 },
      { slug: "webcams", nameFr: "Webcams", nameAr: "كاميرات الويب", icon: "videocam", order: 9 },
      { slug: "power-protection", nameFr: "Protection électrique", nameAr: "الحماية الكهربائية", icon: "electric_bolt", order: 10 },
      { slug: "projectors", nameFr: "Projecteurs", nameAr: "أجهزة العرض", icon: "cast", order: 11 },
    ],
  },
  {
    slug: "desktops", nameFr: "Ordinateurs de bureau", nameAr: "أجهزة الكمبيوتر المكتبية", icon: "computer", order: 4,
    children: [
      { slug: "gaming-desktops", nameFr: "PC Gaming", nameAr: "أجهزة الألعاب", icon: "sports_esports", order: 1 },
      { slug: "desktop-computers", nameFr: "Ordinateurs de bureau", nameAr: "أجهزة الكمبيوتر المكتبية", icon: "computer", order: 2 },
      { slug: "all-in-one-computers", nameFr: "Tout-en-un", nameAr: "أجهزة الكل في واحد", icon: "desktop_windows", order: 3 },
      { slug: "mini-pcs", nameFr: "Mini PC & Chromebox", nameAr: "أجهزة ميني PC", icon: "devices", order: 4 },
      { slug: "gaming-consoles", nameFr: "Consoles de jeu", nameAr: "أجهزة الألعاب المنزلية", icon: "videogame_asset", order: 5 },
    ],
  },
  {
    slug: "laptops", nameFr: "Ordinateurs portables", nameAr: "أجهزة الكمبيوتر المحمولة", icon: "laptop_mac", order: 5,
    children: [
      { slug: "laptops-notebooks", nameFr: "Portables & Notebooks", nameAr: "أجهزة الكمبيوتر المحمولة", icon: "laptop_mac", order: 1 },
      { slug: "tablets-smartphones", nameFr: "Tablettes & Smartphones", nameAr: "الأجهزة اللوحية والهواتف", icon: "tablet_mac", order: 2 },
      { slug: "laptop-accessories", nameFr: "Accessoires portables", nameAr: "ملحقات الأجهزة المحمولة", icon: "laptop_chromebook", order: 3 },
    ],
  },
  {
    slug: "printers-scanners", nameFr: "Imprimantes & Scanners", nameAr: "الطابعات والماسحات الضوئية", icon: "print", order: 6,
    children: [
      { slug: "laser-inkjet-printers", nameFr: "Imprimantes laser & jet d'encre", nameAr: "طابعات ليزر وحبر", icon: "print", order: 1 },
      { slug: "printer-ink-toner", nameFr: "Encre & toner", nameAr: "حبر وتونر الطابعات", icon: "ink_pen", order: 2 },
      { slug: "printer-paper", nameFr: "Papier d'impression", nameAr: "ورق الطباعة", icon: "description", order: 3 },
    ],
  },
  {
    slug: "accessories", nameFr: "Accessoires", nameAr: "الملحقات", icon: "extension", order: 7,
    children: [
      { slug: "adapters", nameFr: "Adaptateurs", nameAr: "المحولات", icon: "settings_input_hdmi", order: 1 },
      { slug: "cables", nameFr: "Câbles", nameAr: "الكابلات", icon: "cable", order: 2 },
      { slug: "computer-accessories", nameFr: "Accessoires informatiques", nameAr: "ملحقات الكمبيوتر", icon: "devices_other", order: 3 },
      { slug: "hubs", nameFr: "Hubs & docks", nameAr: "موزعات USB", icon: "hub", order: 4 },
      { slug: "sound-cards", nameFr: "Cartes son", nameAr: "بطاقات الصوت", icon: "graphic_eq", order: 5 },
    ],
  },
  {
    slug: "networking", nameFr: "Réseau", nameAr: "الشبكات", icon: "router", order: 8,
    children: [
      { slug: "modems-routers", nameFr: "Modems & routeurs", nameAr: "مودم وراوتر", icon: "router", order: 1 },
      { slug: "network-media-players", nameFr: "Lecteurs multimédia réseau", nameAr: "مشغلات الوسائط", icon: "cast_connected", order: 2 },
      { slug: "network-switches", nameFr: "Commutateurs réseau", nameAr: "محولات الشبكة", icon: "device_hub", order: 3 },
      { slug: "wireless-adapters", nameFr: "Adaptateurs sans fil", nameAr: "محولات لاسلكية", icon: "wifi", order: 4 },
      { slug: "wireless-range-extenders", nameFr: "Répéteurs WiFi", nameAr: "موسعات نطاق WiFi", icon: "signal_wifi_4_bar", order: 5 },
    ],
  },
  {
    slug: "furniture", nameFr: "Mobilier bureau & gaming", nameAr: "أثاث المكتب والألعاب", icon: "chair", order: 9,
    children: [
      { slug: "gaming-chairs", nameFr: "Chaises gaming", nameAr: "كراسي الألعاب", icon: "chair", order: 1 },
      { slug: "office-chairs", nameFr: "Chaises de bureau", nameAr: "كراسي المكتب", icon: "chair_alt", order: 2 },
      { slug: "office-furniture", nameFr: "Mobilier de bureau", nameAr: "أثاث المكتب", icon: "desk", order: 3 },
    ],
  },
];

type ProductSeed = {
  slug: string;
  categorySlug: string;
  brand: string;
  nameFr: string;
  nameAr: string;
  descFr: string;
  descAr: string;
  priceDzd: number;
  stock: number;
  images: string[];
  featured: boolean;
  specs: any;
};

const PRODUCTS: ProductSeed[] = [
  // GPUs
  {
    slug: "nvidia-rtx-4090-founders",
    categorySlug: "graphics-cards",
    brand: "NVIDIA",
    nameFr: "NVIDIA GeForce RTX 4090 Founders Edition",
    nameAr: "NVIDIA GeForce RTX 4090 Founders Edition",
    descFr: "La carte graphique ultime pour les joueurs et créateurs exigeants. 24 Go GDDR6X.",
    descAr: "بطاقة الرسوميات القصوى للاعبين والمبدعين المتطلبين. 24 جيجابايت GDDR6X.",
    priceDzd: 285000,
    stock: 5,
    images: [IMG_GPU],
    featured: true,
    specs: { type: "gpu", tdp: 450, lengthMm: 304, powerConnectors: "16-pin" },
  },
  {
    slug: "nvidia-rtx-4080-super",
    categorySlug: "graphics-cards",
    brand: "NVIDIA",
    nameFr: "NVIDIA GeForce RTX 4080 SUPER",
    nameAr: "NVIDIA GeForce RTX 4080 SUPER",
    descFr: "Performance flagship pour le gaming 4K. 16 Go GDDR6X.",
    descAr: "أداء رائد لألعاب 4K. 16 جيجابايت GDDR6X.",
    priceDzd: 195000,
    stock: 8,
    images: [IMG_GPU],
    featured: true,
    specs: { type: "gpu", tdp: 320, lengthMm: 295, powerConnectors: "16-pin" },
  },
  {
    slug: "amd-rx-7900-xtx",
    categorySlug: "graphics-cards",
    brand: "AMD",
    nameFr: "AMD Radeon RX 7900 XTX",
    nameAr: "AMD Radeon RX 7900 XTX",
    descFr: "Alternative haut de gamme AMD avec 24 Go GDDR6.",
    descAr: "بديل AMD عالي الأداء مع 24 جيجابايت GDDR6.",
    priceDzd: 170000,
    stock: 6,
    images: [IMG_GPU],
    featured: false,
    specs: { type: "gpu", tdp: 355, lengthMm: 287, powerConnectors: "2x8-pin" },
  },
  // CPUs
  {
    slug: "intel-i9-14900k",
    categorySlug: "processors",
    brand: "Intel",
    nameFr: "Intel Core i9-14900K 24-Core Unlocked",
    nameAr: "Intel Core i9-14900K 24 نواة",
    descFr: "Processeur phare Intel 14e génération avec 24 cœurs.",
    descAr: "معالج الجيل الرابع عشر الرائد من Intel بـ 24 نواة.",
    priceDzd: 89500,
    stock: 12,
    images: [IMG_CPU],
    featured: true,
    specs: { type: "cpu", socket: "LGA1700", tdp: 125, cores: 24 },
  },
  {
    slug: "intel-i7-14700k",
    categorySlug: "processors",
    brand: "Intel",
    nameFr: "Intel Core i7-14700K",
    nameAr: "Intel Core i7-14700K",
    descFr: "Performance gaming et création, 20 cœurs.",
    descAr: "أداء الألعاب والإبداع، 20 نواة.",
    priceDzd: 62000,
    stock: 15,
    images: [IMG_CPU],
    featured: false,
    specs: { type: "cpu", socket: "LGA1700", tdp: 125, cores: 20 },
  },
  {
    slug: "amd-ryzen-9-7950x",
    categorySlug: "processors",
    brand: "AMD",
    nameFr: "AMD Ryzen 9 7950X",
    nameAr: "AMD Ryzen 9 7950X",
    descFr: "16 cœurs Zen 4, socket AM5.",
    descAr: "16 نواة Zen 4، مقبس AM5.",
    priceDzd: 78000,
    stock: 9,
    images: [IMG_CPU],
    featured: false,
    specs: { type: "cpu", socket: "AM5", tdp: 170, cores: 16 },
  },
  // Motherboards
  {
    slug: "asus-rog-maximus-z790-hero",
    categorySlug: "motherboards",
    brand: "ASUS",
    nameFr: "ASUS ROG Maximus Z790 Hero WiFi",
    nameAr: "ASUS ROG Maximus Z790 Hero WiFi",
    descFr: "Carte mère premium ATX Z790 pour Intel 14e gen.",
    descAr: "لوحة أم ATX Z790 متميزة لمعالجات Intel الجيل 14.",
    priceDzd: 104000,
    stock: 7,
    images: [IMG_MOBO],
    featured: true,
    specs: {
      type: "motherboard",
      socket: "LGA1700",
      formFactor: "ATX",
      ramType: "DDR5",
      ramSlots: 4,
      maxRam: 192,
      m2Slots: 4,
    },
  },
  {
    slug: "msi-mag-b650-tomahawk",
    categorySlug: "motherboards",
    brand: "MSI",
    nameFr: "MSI MAG B650 Tomahawk WiFi",
    nameAr: "MSI MAG B650 Tomahawk WiFi",
    descFr: "ATX AM5 avec WiFi 6E et DDR5.",
    descAr: "ATX AM5 مع WiFi 6E وذاكرة DDR5.",
    priceDzd: 48000,
    stock: 11,
    images: [IMG_MOBO],
    featured: false,
    specs: {
      type: "motherboard",
      socket: "AM5",
      formFactor: "ATX",
      ramType: "DDR5",
      ramSlots: 4,
      maxRam: 128,
      m2Slots: 3,
    },
  },
  // RAM
  {
    slug: "gskill-trident-z5-ddr5-32gb",
    categorySlug: "ram",
    brand: "G.Skill",
    nameFr: "G.Skill Trident Z5 RGB 32GB DDR5-6400",
    nameAr: "G.Skill Trident Z5 RGB 32GB DDR5-6400",
    descFr: "Kit 2x16GB DDR5 haute performance avec RGB.",
    descAr: "طقم 2x16GB DDR5 عالي الأداء مع RGB.",
    priceDzd: 32000,
    stock: 20,
    images: [IMG_GPU],
    featured: false,
    specs: { type: "ram", ramType: "DDR5", sizeGb: 32, speed: 6400, sticks: 2 },
  },
  {
    slug: "corsair-vengeance-ddr5-64gb",
    categorySlug: "ram",
    brand: "Corsair",
    nameFr: "Corsair Vengeance 64GB DDR5-5600",
    nameAr: "Corsair Vengeance 64GB DDR5-5600",
    descFr: "Kit 2x32GB DDR5 pour stations de travail.",
    descAr: "طقم 2x32GB DDR5 لمحطات العمل.",
    priceDzd: 52000,
    stock: 14,
    images: [IMG_GPU],
    featured: false,
    specs: { type: "ram", ramType: "DDR5", sizeGb: 64, speed: 5600, sticks: 2 },
  },
  // PSU
  {
    slug: "corsair-rm1000x",
    categorySlug: "power-supplies",
    brand: "Corsair",
    nameFr: "Corsair RM1000x 80+ Gold 1000W",
    nameAr: "Corsair RM1000x 80+ Gold 1000W",
    descFr: "Alimentation modulaire 1000W certifiée Gold.",
    descAr: "مزود طاقة معياري 1000W معتمد Gold.",
    priceDzd: 38000,
    stock: 18,
    images: [IMG_GPU],
    featured: false,
    specs: { type: "psu", wattage: 1000, formFactor: "ATX", rating: "80+ Gold" },
  },
  // Cases
  {
    slug: "lian-li-o11-dynamic-evo",
    categorySlug: "cases",
    brand: "Lian Li",
    nameFr: "Lian Li O11 Dynamic EVO",
    nameAr: "Lian Li O11 Dynamic EVO",
    descFr: "Boîtier ATX avec panneau verre trempé.",
    descAr: "صندوق ATX مع لوحة زجاج مقسّى.",
    priceDzd: 28000,
    stock: 10,
    images: [IMG_GPU],
    featured: true,
    specs: {
      type: "case",
      supportedFormFactors: ["ATX", "mATX", "ITX"],
      maxGpuLengthMm: 422,
      maxCoolerHeightMm: 167,
    },
  },
  // Coolers
  {
    slug: "nzxt-kraken-elite-360",
    categorySlug: "cpu-cooling",
    brand: "NZXT",
    nameFr: "NZXT Kraken Elite 360 RGB",
    nameAr: "NZXT Kraken Elite 360 RGB",
    descFr: "AIO 360mm avec écran LCD et éclairage RGB.",
    descAr: "AIO 360mm مع شاشة LCD وإضاءة RGB.",
    priceDzd: 54000,
    stock: 13,
    images: [IMG_COOLER],
    featured: true,
    specs: {
      type: "cooler",
      socket: ["LGA1700", "LGA1200", "AM5", "AM4"],
      heightMm: 27,
      tdpSupport: 280,
    },
  },
  {
    slug: "noctua-nh-d15",
    categorySlug: "cpu-cooling",
    brand: "Noctua",
    nameFr: "Noctua NH-D15",
    nameAr: "Noctua NH-D15",
    descFr: "Ventirad premium double tour.",
    descAr: "مبرد هوائي متميز بصفين.",
    priceDzd: 18000,
    stock: 25,
    images: [IMG_COOLER],
    featured: false,
    specs: {
      type: "cooler",
      socket: ["LGA1700", "LGA1200", "AM5", "AM4"],
      heightMm: 165,
      tdpSupport: 250,
    },
  },
  // Storage
  {
    slug: "samsung-990-pro-2tb",
    categorySlug: "ssds",
    brand: "Samsung",
    nameFr: "Samsung 990 PRO 2TB NVMe",
    nameAr: "Samsung 990 PRO 2TB NVMe",
    descFr: "SSD NVMe Gen4 ultra-rapide 2TB.",
    descAr: "SSD NVMe Gen4 فائق السرعة 2TB.",
    priceDzd: 34000,
    stock: 22,
    images: [IMG_GPU],
    featured: true,
    specs: { type: "storage", capacity: "2TB", interface: "NVMe PCIe 4.0" },
  },
  // Laptops
  {
    slug: "asus-rog-strix-g16",
    categorySlug: "laptops-notebooks",
    brand: "ASUS",
    nameFr: "ASUS ROG Strix G16 RTX 4070",
    nameAr: "ASUS ROG Strix G16 RTX 4070",
    descFr: "Laptop gaming i9 / RTX 4070 / 32GB.",
    descAr: "لابتوب للألعاب i9 / RTX 4070 / 32GB.",
    priceDzd: 320000,
    stock: 6,
    images: [IMG_HERO],
    featured: true,
    specs: { type: "other", display: "16\" 240Hz QHD" },
  },
  // Monitors
  {
    slug: "lg-ultragear-27gp950",
    categorySlug: "monitors",
    brand: "LG",
    nameFr: "LG UltraGear 27GP950 4K 144Hz",
    nameAr: "LG UltraGear 27GP950 4K 144Hz",
    descFr: "Moniteur gaming 4K Nano IPS 144Hz.",
    descAr: "شاشة ألعاب 4K Nano IPS 144Hz.",
    priceDzd: 125000,
    stock: 4,
    images: [IMG_HERO],
    featured: true,
    specs: { type: "other", size: "27\"", resolution: "4K", refresh: 144 },
  },
  // Accessories
  {
    slug: "logitech-g-pro-x-superlight",
    categorySlug: "computer-accessories",
    brand: "Logitech",
    nameFr: "Logitech G PRO X Superlight",
    nameAr: "Logitech G PRO X Superlight",
    descFr: "Souris gaming sans fil ultra-légère.",
    descAr: "فأرة ألعاب لاسلكية فائقة الخفة.",
    priceDzd: 22000,
    stock: 30,
    images: [IMG_HERO],
    featured: false,
    specs: { type: "other" },
  },
];

export default mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing
    const existing = await ctx.db.query("products").collect();
    for (const p of existing) await ctx.db.delete(p._id);
    const existingCats = await ctx.db.query("categories").collect();
    for (const c of existingCats) await ctx.db.delete(c._id);

    // Insert categories (hierarchical)
    const catIds: Record<string, any> = {};
    for (const parent of HIERARCHY) {
      const { children, ...parentData } = parent;
      const parentId = await ctx.db.insert("categories", parentData);
      catIds[parent.slug] = parentId;
      for (const child of children) {
        catIds[child.slug] = await ctx.db.insert("categories", {
          ...child,
          parentId,
        });
      }
    }

    // Insert products
    for (const p of PRODUCTS) {
      const { categorySlug, ...rest } = p;
      await ctx.db.insert("products", {
        ...rest,
        categoryId: catIds[categorySlug],
        createdAt: Date.now(),
      });
    }

    const totalCats = HIERARCHY.reduce((sum, p) => sum + 1 + p.children.length, 0);
    return { categories: totalCats, products: PRODUCTS.length };
  },
});
