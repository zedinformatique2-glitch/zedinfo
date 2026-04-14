import { mutation } from "./_generated/server";

/**
 * Migration: Insert the full hierarchical category structure
 * and remap existing products from old flat categories to new subcategories.
 *
 * Run with: npx convex run seedCategories:default
 */

const HIERARCHY = [
  {
    slug: "pc-components",
    nameFr: "Composants PC",
    nameAr: "مكونات الكمبيوتر",
    icon: "memory",
    order: 1,
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
    slug: "storage-devices",
    nameFr: "Stockage",
    nameAr: "أجهزة التخزين",
    icon: "storage",
    order: 2,
    children: [
      { slug: "hard-drives", nameFr: "Disques durs", nameAr: "الأقراص الصلبة", icon: "hard_drive", order: 1 },
      { slug: "ssds", nameFr: "SSD", nameAr: "أقراص SSD", icon: "speed", order: 2 },
      { slug: "usb-flash-drives", nameFr: "Clés USB & cartes mémoire", nameAr: "فلاش USB وبطاقات الذاكرة", icon: "usb", order: 3 },
      { slug: "optical-drives", nameFr: "Lecteurs optiques", nameAr: "محركات الأقراص الضوئية", icon: "album", order: 4 },
    ],
  },
  {
    slug: "peripherals",
    nameFr: "Périphériques",
    nameAr: "الأجهزة الطرفية",
    icon: "monitor",
    order: 3,
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
    slug: "desktops",
    nameFr: "Ordinateurs de bureau",
    nameAr: "أجهزة الكمبيوتر المكتبية",
    icon: "computer",
    order: 4,
    children: [
      { slug: "gaming-desktops", nameFr: "PC Gaming", nameAr: "أجهزة الألعاب", icon: "sports_esports", order: 1 },
      { slug: "desktop-computers", nameFr: "Ordinateurs de bureau", nameAr: "أجهزة الكمبيوتر المكتبية", icon: "computer", order: 2 },
      { slug: "all-in-one-computers", nameFr: "Tout-en-un", nameAr: "أجهزة الكل في واحد", icon: "desktop_windows", order: 3 },
      { slug: "mini-pcs", nameFr: "Mini PC & Chromebox", nameAr: "أجهزة ميني PC", icon: "devices", order: 4 },
      { slug: "gaming-consoles", nameFr: "Consoles de jeu", nameAr: "أجهزة الألعاب المنزلية", icon: "videogame_asset", order: 5 },
    ],
  },
  {
    slug: "laptops",
    nameFr: "Ordinateurs portables",
    nameAr: "أجهزة الكمبيوتر المحمولة",
    icon: "laptop_mac",
    order: 5,
    children: [
      { slug: "laptops-notebooks", nameFr: "Portables & Notebooks", nameAr: "أجهزة الكمبيوتر المحمولة", icon: "laptop_mac", order: 1 },
      { slug: "tablets-smartphones", nameFr: "Tablettes & Smartphones", nameAr: "الأجهزة اللوحية والهواتف", icon: "tablet_mac", order: 2 },
      { slug: "laptop-accessories", nameFr: "Accessoires portables", nameAr: "ملحقات الأجهزة المحمولة", icon: "laptop_chromebook", order: 3 },
    ],
  },
  {
    slug: "printers-scanners",
    nameFr: "Imprimantes & Scanners",
    nameAr: "الطابعات والماسحات الضوئية",
    icon: "print",
    order: 6,
    children: [
      { slug: "laser-inkjet-printers", nameFr: "Imprimantes laser & jet d'encre", nameAr: "طابعات ليزر وحبر", icon: "print", order: 1 },
      { slug: "printer-ink-toner", nameFr: "Encre & toner", nameAr: "حبر وتونر الطابعات", icon: "ink_pen", order: 2 },
      { slug: "printer-paper", nameFr: "Papier d'impression", nameAr: "ورق الطباعة", icon: "description", order: 3 },
    ],
  },
  {
    slug: "accessories",
    nameFr: "Accessoires",
    nameAr: "الملحقات",
    icon: "extension",
    order: 7,
    children: [
      { slug: "adapters", nameFr: "Adaptateurs", nameAr: "المحولات", icon: "settings_input_hdmi", order: 1 },
      { slug: "cables", nameFr: "Câbles", nameAr: "الكابلات", icon: "cable", order: 2 },
      { slug: "computer-accessories", nameFr: "Accessoires informatiques", nameAr: "ملحقات الكمبيوتر", icon: "devices_other", order: 3 },
      { slug: "hubs", nameFr: "Hubs & docks", nameAr: "موزعات USB", icon: "hub", order: 4 },
      { slug: "sound-cards", nameFr: "Cartes son", nameAr: "بطاقات الصوت", icon: "graphic_eq", order: 5 },
    ],
  },
  {
    slug: "networking",
    nameFr: "Réseau",
    nameAr: "الشبكات",
    icon: "router",
    order: 8,
    children: [
      { slug: "modems-routers", nameFr: "Modems & routeurs", nameAr: "مودم وراوتر", icon: "router", order: 1 },
      { slug: "network-media-players", nameFr: "Lecteurs multimédia réseau", nameAr: "مشغلات الوسائط", icon: "cast_connected", order: 2 },
      { slug: "network-switches", nameFr: "Commutateurs réseau", nameAr: "محولات الشبكة", icon: "device_hub", order: 3 },
      { slug: "wireless-adapters", nameFr: "Adaptateurs sans fil", nameAr: "محولات لاسلكية", icon: "wifi", order: 4 },
      { slug: "wireless-range-extenders", nameFr: "Répéteurs WiFi", nameAr: "موسعات نطاق WiFi", icon: "signal_wifi_4_bar", order: 5 },
    ],
  },
  {
    slug: "furniture",
    nameFr: "Mobilier bureau & gaming",
    nameAr: "أثاث المكتب والألعاب",
    icon: "chair",
    order: 9,
    children: [
      { slug: "gaming-chairs", nameFr: "Chaises gaming", nameAr: "كراسي الألعاب", icon: "chair", order: 1 },
      { slug: "office-chairs", nameFr: "Chaises de bureau", nameAr: "كراسي المكتب", icon: "chair_alt", order: 2 },
      { slug: "office-furniture", nameFr: "Mobilier de bureau", nameAr: "أثاث المكتب", icon: "desk", order: 3 },
    ],
  },
];

// Maps old category slugs to new subcategory slugs
const SLUG_REMAP: Record<string, string> = {
  "cooling": "cpu-cooling",
  "storage": "ssds",
  "laptops": "laptops-notebooks",
  "accessories": "computer-accessories",
  "keyboards": "keyboards",
  "mice": "mice",
  "headsets": "headsets",
  "controllers": "game-controllers",
  "mouse-pads": "mouse-pads",
  // These stay the same slug (already exist in new hierarchy)
  "processors": "processors",
  "graphics-cards": "graphics-cards",
  "motherboards": "motherboards",
  "ram": "ram",
  "power-supplies": "power-supplies",
  "cases": "cases",
  "monitors": "monitors",
};

export default mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get all existing categories and products
    const existingCats = await ctx.db.query("categories").collect();
    const existingProducts = await ctx.db.query("products").collect();

    // Build old slug → categoryId map
    const oldSlugToId: Record<string, string> = {};
    for (const cat of existingCats) {
      oldSlugToId[cat.slug] = cat._id;
    }

    // 2. Delete all existing categories
    for (const cat of existingCats) {
      await ctx.db.delete(cat._id);
    }

    // 3. Insert new parent categories first, then children
    const newSlugToId: Record<string, string> = {};

    for (const parent of HIERARCHY) {
      const parentId = await ctx.db.insert("categories", {
        slug: parent.slug,
        nameFr: parent.nameFr,
        nameAr: parent.nameAr,
        icon: parent.icon,
        order: parent.order,
      });
      newSlugToId[parent.slug] = parentId;

      for (const child of parent.children) {
        const childId = await ctx.db.insert("categories", {
          slug: child.slug,
          nameFr: child.nameFr,
          nameAr: child.nameAr,
          icon: child.icon,
          order: child.order,
          parentId: parentId,
        });
        newSlugToId[child.slug] = childId;
      }
    }

    // 4. Remap existing products to new category IDs
    let remapped = 0;
    for (const product of existingProducts) {
      // Find old category slug
      const oldCat = existingCats.find((c) => c._id === product.categoryId);
      if (!oldCat) continue;

      const newSlug = SLUG_REMAP[oldCat.slug] ?? oldCat.slug;
      const newCatId = newSlugToId[newSlug];

      if (newCatId) {
        await ctx.db.patch(product._id, { categoryId: newCatId as any });
        remapped++;
      }
    }

    const totalCats = HIERARCHY.reduce((sum, p) => sum + 1 + p.children.length, 0);
    return {
      parents: HIERARCHY.length,
      totalCategories: totalCats,
      productsRemapped: remapped,
    };
  },
});
