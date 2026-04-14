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

const CATEGORIES = [
  { slug: "laptops", nameFr: "Ordinateurs portables", nameAr: "أجهزة الكمبيوتر المحمولة", icon: "laptop_mac", order: 1 },
  { slug: "graphics-cards", nameFr: "Cartes graphiques", nameAr: "بطاقات الرسوميات", icon: "memory", order: 2 },
  { slug: "processors", nameFr: "Processeurs", nameAr: "المعالجات", icon: "developer_board", order: 3 },
  { slug: "motherboards", nameFr: "Cartes mères", nameAr: "اللوحات الأم", icon: "dashboard", order: 4 },
  { slug: "ram", nameFr: "Mémoire RAM", nameAr: "الذاكرة العشوائية", icon: "memory_alt", order: 5 },
  { slug: "storage", nameFr: "Stockage", nameAr: "التخزين", icon: "storage", order: 6 },
  { slug: "power-supplies", nameFr: "Alimentations", nameAr: "مزودات الطاقة", icon: "bolt", order: 7 },
  { slug: "cases", nameFr: "Boîtiers", nameAr: "الصناديق", icon: "view_in_ar", order: 8 },
  { slug: "cooling", nameFr: "Refroidissement", nameAr: "التبريد", icon: "ac_unit", order: 9 },
  { slug: "monitors", nameFr: "Moniteurs", nameAr: "الشاشات", icon: "monitor", order: 10 },
  { slug: "accessories", nameFr: "Accessoires", nameAr: "الملحقات", icon: "keyboard", order: 11 },
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
    categorySlug: "cooling",
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
    categorySlug: "cooling",
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
    categorySlug: "storage",
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
    categorySlug: "laptops",
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
    categorySlug: "accessories",
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

    // Insert categories
    const catIds: Record<string, any> = {};
    for (const cat of CATEGORIES) {
      catIds[cat.slug] = await ctx.db.insert("categories", cat);
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

    return { categories: CATEGORIES.length, products: PRODUCTS.length };
  },
});
