import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/lib/i18n/routing";
import { buildAlternates } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 3600;

const LAST_UPDATED = "2026-08-05";

type Section = { icon: string; title: string; body: string[] };
type Content = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  updated: string;
  highlights: { icon: string; label: string; value: string }[];
  sections: Section[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
};

const CONTENT: Record<Locale, Content> = {
  fr: {
    metaTitle: "Politique de retour et d'échange",
    metaDescription:
      "Retours acceptés sous 7 jours après livraison, échanges acceptés, garantie constructeur sur les produits défectueux. Conditions complètes chez ZED INFORMATIQUE.",
    title: "Politique de retour",
    subtitle:
      "Vous disposez de 7 jours après la livraison pour demander un retour ou un échange. Voici exactement comment cela fonctionne.",
    updated: "Dernière mise à jour",
    highlights: [
      { icon: "event_available", label: "Délai de retour", value: "7 jours après livraison" },
      { icon: "swap_horiz", label: "Échanges", value: "Acceptés" },
      { icon: "verified_user", label: "Produits défectueux", value: "Remplacés ou remboursés" },
    ],
    sections: [
      {
        icon: "schedule",
        title: "1. Délai de retour",
        body: [
          "Vous pouvez demander le retour d'un produit dans un délai de 7 jours calendaires à compter de la date de livraison, que le produit présente un défaut ou non.",
          "Toute demande introduite après ce délai ne pourra être traitée qu'au titre de la garantie constructeur (voir section 5).",
        ],
      },
      {
        icon: "inventory_2",
        title: "2. Conditions d'acceptation",
        body: [
          "Le produit doit être dans son emballage d'origine, complet (câbles, accessoires, notices, plaque d'E/S, vis, etc.).",
          "Le produit ne doit pas présenter de trace d'utilisation anormale, de choc, de liquide, de surtension, de démontage ni de retrait des étiquettes ou numéros de série.",
          "La facture ou le numéro de commande (format ZED-AAMMJJ-XXXX) doit être fourni.",
          "Nous nous réservons le droit de refuser un retour ou d'appliquer une décote si le produit nous revient incomplet ou endommagé par le client.",
        ],
      },
      {
        icon: "block",
        title: "3. Produits non éligibles au retour pour changement d'avis",
        body: [
          "Logiciels, licences et clés d'activation dès lors que l'emballage est ouvert ou que la clé a été révélée ou activée.",
          "PC assemblés sur mesure via notre configurateur, montés spécifiquement à votre demande.",
          "Consommables et produits ouverts par nature : pâte thermique, câbles coupés ou sertis, petits accessoires descellés.",
          "Ces produits restent bien entendu couverts en cas de défaut : voir les sections 4 et 5.",
        ],
      },
      {
        icon: "build",
        title: "4. Produit défectueux, erroné ou endommagé au transport",
        body: [
          "Si le produit reçu est défectueux, ne correspond pas à votre commande, ou est arrivé endommagé, contactez-nous dans les 48 heures suivant la livraison avec des photos du produit et de l'emballage.",
          "Dans ce cas, les frais de retour et de réexpédition sont intégralement à la charge de ZED INFORMATIQUE.",
          "Nous procédons, selon votre choix et la disponibilité du stock, au remplacement du produit ou au remboursement intégral (produit + frais de livraison initiaux).",
        ],
      },
      {
        icon: "verified",
        title: "5. Garantie constructeur",
        body: [
          "Au-delà des 7 jours, les produits restent couverts par la garantie du constructeur applicable à chaque référence, à compter de la date de la facture.",
          "La garantie couvre les défauts de fabrication et exclut les dommages causés par une mauvaise utilisation, une surtension, un liquide, un overclocking, une intervention par un tiers ou le retrait du numéro de série.",
          "Les prises en charge sous garantie se font via notre formulaire de demande de retour / RMA sur la page Service après-vente.",
        ],
      },
      {
        icon: "swap_horiz",
        title: "6. Échanges",
        body: [
          "Nous acceptons les échanges. Dans le délai de 7 jours, vous pouvez échanger un produit contre un autre article de valeur égale ou supérieure, sous les mêmes conditions que celles décrites en section 2.",
          "Si le nouvel article est plus cher, la différence est à régler. S'il est moins cher, la différence vous est remboursée selon les modalités de la section 8.",
        ],
      },
      {
        icon: "local_shipping",
        title: "7. Frais de retour",
        body: [
          "Retour pour changement d'avis : les frais de retour sont à la charge du client. Les frais de livraison initiaux ne sont pas remboursés.",
          "Retour pour produit défectueux, erroné ou endommagé au transport : les frais sont intégralement pris en charge par ZED INFORMATIQUE.",
          "Le retour peut se faire par le transporteur de votre choix ou par dépôt direct à notre magasin à Djelfa.",
        ],
      },
      {
        icon: "payments",
        title: "8. Remboursement",
        body: [
          "Le remboursement est effectué après réception et contrôle du produit dans nos locaux, dans un délai de 7 jours ouvrables.",
          "Il est versé par le même moyen que le paiement initial. Pour les commandes payées à la livraison (COD), le remboursement se fait en espèces au magasin ou par virement bancaire / CCP selon votre préférence.",
        ],
      },
      {
        icon: "support_agent",
        title: "9. Comment demander un retour",
        body: [
          "1. Remplissez le formulaire de demande de retour / RMA sur notre page Service après-vente, ou contactez-nous par téléphone, WhatsApp ou e-mail.",
          "2. Indiquez votre numéro de commande, le produit concerné et le motif du retour (avec photos en cas de défaut).",
          "3. Nous vous répondons sous 48 heures ouvrables avec la procédure et l'adresse de retour.",
          "4. N'expédiez pas un produit sans avoir reçu notre accord : les colis non annoncés peuvent être refusés.",
        ],
      },
    ],
    ctaTitle: "Besoin d'un retour ou d'un échange ?",
    ctaBody:
      "Notre équipe traite votre demande sous 48 heures ouvrables. Munissez-vous de votre numéro de commande.",
    ctaButton: "Ouvrir une demande de retour",
  },
  ar: {
    metaTitle: "سياسة الإرجاع والاستبدال",
    metaDescription:
      "نقبل الإرجاع خلال 7 أيام من التسليم، ونقبل الاستبدال، مع ضمان المُصنّع على المنتجات المعيبة. الشروط الكاملة لدى ZED INFORMATIQUE.",
    title: "سياسة الإرجاع",
    subtitle:
      "لديك 7 أيام بعد التسليم لطلب الإرجاع أو الاستبدال. إليك كيفية عمل ذلك بالتفصيل.",
    updated: "آخر تحديث",
    highlights: [
      { icon: "event_available", label: "مدة الإرجاع", value: "7 أيام بعد التسليم" },
      { icon: "swap_horiz", label: "الاستبدال", value: "مقبول" },
      { icon: "verified_user", label: "المنتجات المعيبة", value: "استبدال أو استرداد" },
    ],
    sections: [
      {
        icon: "schedule",
        title: "1. مدة الإرجاع",
        body: [
          "يمكنك طلب إرجاع أي منتج خلال 7 أيام تقويمية من تاريخ التسليم، سواء كان المنتج معيبًا أم لا.",
          "أي طلب يُقدَّم بعد هذه المدة لا يمكن معالجته إلا في إطار ضمان المُصنّع (انظر القسم 5).",
        ],
      },
      {
        icon: "inventory_2",
        title: "2. شروط القبول",
        body: [
          "يجب أن يكون المنتج في عبوته الأصلية وكاملًا (الكابلات، الملحقات، الأدلة، لوحة المنافذ، البراغي، إلخ).",
          "يجب أن يكون المنتج خاليًا من آثار الاستخدام غير الطبيعي أو الصدمات أو السوائل أو التيار الزائد أو الفتح والتفكيك أو إزالة الملصقات والأرقام التسلسلية.",
          "يجب تقديم الفاتورة أو رقم الطلب (بصيغة ZED-YYMMDD-XXXX).",
          "نحتفظ بالحق في رفض الإرجاع أو تطبيق خصم على القيمة إذا وصلنا المنتج ناقصًا أو متضررًا بسبب العميل.",
        ],
      },
      {
        icon: "block",
        title: "3. منتجات غير مؤهلة للإرجاع بسبب تغيير الرأي",
        body: [
          "البرمجيات والتراخيص ومفاتيح التنشيط بعد فتح العبوة أو كشف المفتاح أو تنشيطه.",
          "أجهزة الكمبيوتر المُجمَّعة حسب الطلب عبر أداة التجميع، والتي رُكِّبت خصيصًا بناءً على طلبك.",
          "المواد الاستهلاكية والمنتجات المفتوحة بطبيعتها: المعجون الحراري، الكابلات المقطوعة أو المُلحَّمة، الملحقات الصغيرة بعد إزالة الغلاف.",
          "تظل هذه المنتجات مشمولة بالتأكيد في حالة وجود عيب: انظر القسمين 4 و5.",
        ],
      },
      {
        icon: "build",
        title: "4. منتج معيب أو خاطئ أو متضرر أثناء النقل",
        body: [
          "إذا كان المنتج المُستلم معيبًا أو غير مطابق لطلبك أو وصل متضررًا، اتصل بنا خلال 48 ساعة من التسليم مع صور للمنتج والعبوة.",
          "في هذه الحالة تتحمل ZED INFORMATIQUE كامل تكاليف الإرجاع وإعادة الإرسال.",
          "نقوم، حسب اختيارك وتوفر المخزون، باستبدال المنتج أو استرداد المبلغ كاملًا (ثمن المنتج + تكاليف التوصيل الأصلية).",
        ],
      },
      {
        icon: "verified",
        title: "5. ضمان المُصنّع",
        body: [
          "بعد مرور 7 أيام، تبقى المنتجات مشمولة بضمان المُصنّع الخاص بكل مرجع، ابتداءً من تاريخ الفاتورة.",
          "يغطي الضمان عيوب التصنيع ويستثني الأضرار الناتجة عن سوء الاستخدام أو التيار الزائد أو السوائل أو كسر السرعة أو تدخل طرف ثالث أو إزالة الرقم التسلسلي.",
          "تُعالَج طلبات الضمان عبر استمارة طلب الإرجاع / RMA في صفحة خدمة ما بعد البيع.",
        ],
      },
      {
        icon: "swap_horiz",
        title: "6. الاستبدال",
        body: [
          "نقبل الاستبدال. خلال مدة 7 أيام، يمكنك استبدال منتج بمنتج آخر بقيمة مساوية أو أعلى، وفق الشروط نفسها الواردة في القسم 2.",
          "إذا كان المنتج الجديد أغلى، تُسدَّد الفارق. وإذا كان أرخص، يُرَد لك الفارق وفق الطرق الواردة في القسم 8.",
        ],
      },
      {
        icon: "local_shipping",
        title: "7. تكاليف الإرجاع",
        body: [
          "الإرجاع بسبب تغيير الرأي: تكاليف الإرجاع على عاتق العميل، ولا تُرَد تكاليف التوصيل الأصلية.",
          "الإرجاع بسبب منتج معيب أو خاطئ أو متضرر أثناء النقل: تتحمل ZED INFORMATIQUE كامل التكاليف.",
          "يمكن الإرجاع عبر شركة التوصيل التي تختارها أو بالتسليم المباشر في متجرنا بالجلفة.",
        ],
      },
      {
        icon: "payments",
        title: "8. استرداد المبلغ",
        body: [
          "يُنفَّذ الاسترداد بعد استلام المنتج ومعاينته في مقرنا، في غضون 7 أيام عمل.",
          "يُدفع بالوسيلة نفسها التي استُخدمت في الدفع الأصلي. أما الطلبات المدفوعة عند التسليم (COD)، فيتم الاسترداد نقدًا في المتجر أو بتحويل بنكي / بريدي حسب تفضيلك.",
        ],
      },
      {
        icon: "support_agent",
        title: "9. كيف تطلب الإرجاع",
        body: [
          "1. املأ استمارة طلب الإرجاع / RMA في صفحة خدمة ما بعد البيع، أو اتصل بنا هاتفيًا أو عبر واتساب أو البريد الإلكتروني.",
          "2. اذكر رقم طلبك والمنتج المعني وسبب الإرجاع (مع صور في حالة وجود عيب).",
          "3. نرد عليك خلال 48 ساعة عمل بالإجراءات وعنوان الإرجاع.",
          "4. لا تُرسل أي منتج قبل الحصول على موافقتنا: قد تُرفض الطرود غير المعلنة مسبقًا.",
        ],
      },
    ],
    ctaTitle: "بحاجة إلى إرجاع أو استبدال؟",
    ctaBody:
      "يعالج فريقنا طلبك خلال 48 ساعة عمل. تأكد من توفر رقم طلبك.",
    ctaButton: "فتح طلب إرجاع",
  },
  en: {
    metaTitle: "Return & Exchange Policy",
    metaDescription:
      "Returns accepted within 7 days of delivery, exchanges accepted, manufacturer warranty on defective products. Full terms at ZED INFORMATIQUE.",
    title: "Return policy",
    subtitle:
      "You have 7 days after delivery to request a return or an exchange. Here is exactly how it works.",
    updated: "Last updated",
    highlights: [
      { icon: "event_available", label: "Return window", value: "7 days after delivery" },
      { icon: "swap_horiz", label: "Exchanges", value: "Accepted" },
      { icon: "verified_user", label: "Defective products", value: "Replaced or refunded" },
    ],
    sections: [
      {
        icon: "schedule",
        title: "1. Return window",
        body: [
          "You may request a return within 7 calendar days from the delivery date, whether or not the product is defective.",
          "Requests made after this window can only be handled under the manufacturer warranty (see section 5).",
        ],
      },
      {
        icon: "inventory_2",
        title: "2. Conditions of acceptance",
        body: [
          "The product must be in its original packaging and complete (cables, accessories, manuals, I/O shield, screws, etc.).",
          "The product must show no sign of abnormal use, impact, liquid, power surge, disassembly, or removal of labels and serial numbers.",
          "The invoice or order number (format ZED-YYMMDD-XXXX) must be provided.",
          "We reserve the right to refuse a return or apply a deduction if the product reaches us incomplete or damaged by the customer.",
        ],
      },
      {
        icon: "block",
        title: "3. Products not eligible for change-of-mind returns",
        body: [
          "Software, licenses and activation keys once the packaging is opened or the key has been revealed or activated.",
          "Custom PCs assembled through our configurator, built specifically to your order.",
          "Consumables and products opened by nature: thermal paste, cut or crimped cables, unsealed small accessories.",
          "These products remain covered in the event of a defect: see sections 4 and 5.",
        ],
      },
      {
        icon: "build",
        title: "4. Defective, incorrect, or transit-damaged product",
        body: [
          "If the product you received is defective, does not match your order, or arrived damaged, contact us within 48 hours of delivery with photos of the product and the packaging.",
          "In that case, return and reshipping costs are fully covered by ZED INFORMATIQUE.",
          "Depending on your choice and stock availability, we either replace the product or issue a full refund (product + original delivery fee).",
        ],
      },
      {
        icon: "verified",
        title: "5. Manufacturer warranty",
        body: [
          "Beyond the 7-day window, products remain covered by the manufacturer warranty applicable to each item, starting from the invoice date.",
          "The warranty covers manufacturing defects and excludes damage caused by misuse, power surges, liquid, overclocking, third-party intervention, or removal of the serial number.",
          "Warranty claims are handled through our return / RMA request form on the After-sales support page.",
        ],
      },
      {
        icon: "swap_horiz",
        title: "6. Exchanges",
        body: [
          "We accept exchanges. Within the 7-day window you may exchange a product for another item of equal or greater value, under the same conditions as section 2.",
          "If the new item costs more, the difference is payable. If it costs less, the difference is refunded to you as described in section 8.",
        ],
      },
      {
        icon: "local_shipping",
        title: "7. Return shipping costs",
        body: [
          "Change-of-mind return: return shipping is paid by the customer, and the original delivery fee is not refunded.",
          "Defective, incorrect, or transit-damaged product: costs are fully covered by ZED INFORMATIQUE.",
          "Returns may be shipped with the carrier of your choice or dropped off directly at our store in Djelfa.",
        ],
      },
      {
        icon: "payments",
        title: "8. Refunds",
        body: [
          "Refunds are issued after the product is received and inspected at our premises, within 7 business days.",
          "The refund is made using the same method as the original payment. For cash-on-delivery (COD) orders, the refund is paid in cash at the store or by bank / CCP transfer, as you prefer.",
        ],
      },
      {
        icon: "support_agent",
        title: "9. How to request a return",
        body: [
          "1. Fill in the return / RMA request form on our After-sales support page, or contact us by phone, WhatsApp, or email.",
          "2. Provide your order number, the product concerned, and the reason for the return (with photos if there is a defect).",
          "3. We reply within 48 business hours with the procedure and the return address.",
          "4. Do not ship a product before receiving our approval: unannounced parcels may be refused.",
        ],
      },
    ],
    ctaTitle: "Need a return or an exchange?",
    ctaBody:
      "Our team handles your request within 48 business hours. Have your order number ready.",
    ctaButton: "Open a return request",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = CONTENT[locale as Locale] ?? CONTENT.fr;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: buildAlternates(locale as Locale, "/return-policy"),
  };
}

export default async function ReturnPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTENT[locale as Locale] ?? CONTENT.fr;
  const updatedLabel = new Date(LAST_UPDATED).toLocaleDateString(
    locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-FR",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div>
      <section className="bg-slate-950 text-white py-24">
        <div className="container-zed">
          <h1 className="text-4xl lg:text-7xl font-black tracking-tighter uppercase">
            {c.title}
          </h1>
          <p className="text-slate-400 mt-6 max-w-2xl text-lg">{c.subtitle}</p>
          <p className="text-slate-500 mt-4 text-sm">
            {c.updated}: {updatedLabel}
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-zed grid sm:grid-cols-3 gap-4">
          {c.highlights.map((h) => (
            <div
              key={h.icon}
              className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={h.icon} className="text-[22px]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                  {h.label}
                </p>
                <p className="font-black mt-1">{h.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="container-zed space-y-4">
          {c.sections.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-8 lg:p-10"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={s.icon} className="text-[20px]" />
                </div>
                <h2 className="font-black uppercase tracking-tight text-xl lg:text-2xl">
                  {s.title}
                </h2>
              </div>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-primary text-white rounded-3xl shadow-card p-8 lg:p-10">
            <h2 className="font-black uppercase tracking-tight text-xl lg:text-2xl">
              {c.ctaTitle}
            </h2>
            <p className="text-white/80 mt-3 max-w-2xl leading-relaxed">{c.ctaBody}</p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 mt-6 rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <Icon name="assignment_return" className="text-[20px]" />
              {c.ctaButton}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
