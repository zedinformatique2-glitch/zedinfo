"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/lib/cart-store";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { WILAYAS_BILINGUAL, getCommunesForWilaya, getShippingCost, getWilayaNumber } from "@/lib/wilayas";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDzd } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  wilaya: z.string().min(1),
  commune: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cod", "whatsapp"]),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("checkout");
  const tc = useTranslations("common");

  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal());
  const createOrder = useMutation(api.orders.create);
  const enabledCarriers = useQuery(api.delivery.getEnabledCarriers);
  const getCarrierFees = useAction(api.delivery.getFees);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dynamicShipping, setDynamicShipping] = useState<number | null>(null);
  const [fetchingFees, setFetchingFees] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "cod" },
  });

  const wilaya = watch("wilaya");
  const communes = wilaya ? getCommunesForWilaya(wilaya) : [];

  // Reset commune when wilaya changes, and try to fetch real shipping fees
  useEffect(() => {
    setValue("commune", "");
    setDynamicShipping(null);

    if (!wilaya) return;
    const defaultCarrier = (enabledCarriers ?? []).find((c: any) => c.isDefault && c.hasApi && c.credentials);
    if (!defaultCarrier) return;

    const wilayaNum = getWilayaNumber(wilaya);
    if (wilayaNum === 0) return;

    let cancelled = false;
    setFetchingFees(true);
    getCarrierFees({
      slug: defaultCarrier.slug,
      credentials: defaultCarrier.credentials!,
      fromWilaya: 17, // Djelfa (store location)
      toWilaya: wilayaNum,
    }).then((result: any) => {
      if (!cancelled && result.fee > 0) {
        setDynamicShipping(result.fee);
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setFetchingFees(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wilaya, enabledCarriers]);

  const shipping = dynamicShipping ?? (wilaya ? getShippingCost(wilaya) : 800);
  const total = subtotal + shipping;

  async function onSubmit(data: FormData) {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const result = await createOrder({
        items: items.map((i) => ({
          productId: i.productId as any,
          slug: i.slug,
          nameFr: i.nameFr,
          nameAr: i.nameAr,
          priceDzd: i.priceDzd,
          qty: i.qty,
          image: i.image,
        })),
        shippingDzd: shipping,
        customer: {
          fullName: data.fullName,
          phone: data.phone,
          wilaya: data.wilaya,
          commune: data.commune || undefined,
          address: data.address || "",
          notes: data.notes || undefined,
        },
        paymentMethod: data.paymentMethod,
        locale,
      });

      if (data.paymentMethod === "whatsapp") {
        const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "213663287772";
        const url = buildWhatsAppUrl({
          phoneNumber: phone,
          orderNumber: result.orderNumber,
          items,
          subtotal,
          shipping,
          total,
          customer: {
            fullName: data.fullName,
            phone: data.phone,
            wilaya: data.wilaya,
            commune: data.commune || "",
            address: data.address || "",
            notes: data.notes || "",
          },
          locale: locale as "ar" | "fr",
        });
        setSubmitted(true);
        clear();
        window.location.href = url;
        return;
      }

      setSubmitted(true);
      clear();
      router.push(`/order/${result.id}`);
    } catch (err) {
      alert(tc("error"));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return <div className="container-zed py-24">{tc("loading")}</div>;

  if (items.length === 0 && !submitted) {
    return (
      <div className="container-zed py-24 text-center">
        <h1 className="text-3xl font-black uppercase">{tc("error")}</h1>
      </div>
    );
  }

  if (submitted) {
    return <div className="container-zed py-24 text-center">{tc("loading")}</div>;
  }

  return (
    <div className="container-zed py-6 px-4 sm:py-12 lg:py-16 sm:px-6">
      <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tighter uppercase mb-6 sm:mb-12">
        {t("title")}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-6 sm:gap-12">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-outline-variant pb-2">
              {t("contactInfo")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>{t("fullName")}</Label>
                <Input {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-error text-xs mt-1">{errors.fullName.message}</p>
                )}
              </div>
              <div>
                <Label>{t("phone")}</Label>
                <Input {...register("phone")} type="tel" />
                {errors.phone && (
                  <p className="text-error text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-outline-variant pb-2">
              {t("shippingAddress")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>{t("wilaya")}</Label>
                <Select {...register("wilaya")}>
                  <option value="">—</option>
                  {WILAYAS_BILINGUAL.map((w) => (
                    <option key={w.fr} value={w.fr}>
                      {locale === "ar" ? `${w.ar} — ${w.fr}` : w.fr}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{t("commune")}</Label>
                <Select {...register("commune")} disabled={!wilaya}>
                  <option value="">{wilaya ? "—" : t("communePlaceholder")}</option>
                  {communes.map((c) => (
                    <option key={c.fr} value={c.fr}>
                      {locale === "ar" ? `${c.ar} — ${c.fr}` : c.fr}
                    </option>
                  ))}
                </Select>
                {errors.commune && (
                  <p className="text-error text-xs mt-1">{errors.commune.message}</p>
                )}
              </div>
              <div>
                <Label>{t("address")}</Label>
                <Input {...register("address")} />
              </div>
              <div className="sm:col-span-2">
                <Label>{t("notes")}</Label>
                <Textarea {...register("notes")} rows={3} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-outline-variant pb-2">
              {t("paymentMethod")}
            </h2>
            <div className="space-y-3 mt-4">
              <label className="flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white ring-1 ring-outline-variant/60 shadow-card cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 transition-all">
                <input type="radio" value="cod" {...register("paymentMethod")} />
                <Icon name="payments" className="text-primary" />
                <span className="font-bold uppercase text-xs sm:text-sm">{t("cod")}</span>
              </label>
              <label className="flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white ring-1 ring-outline-variant/60 shadow-card cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 transition-all">
                <input type="radio" value="whatsapp" {...register("paymentMethod")} />
                <Icon name="chat" className="text-primary" />
                <span className="font-bold uppercase text-xs sm:text-sm">{t("whatsapp")}</span>
              </label>
            </div>
          </section>
        </div>

        <div>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-4 sm:p-6 lg:p-8 sticky top-24 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />
            <h2 className="font-bold uppercase tracking-widest text-xs mb-6">
              {tc("total")}
            </h2>
            <div className="space-y-3 mb-6 text-sm">
              {items.map((i) => (
                <div key={i.slug} className="flex justify-between">
                  <span className="truncate pe-2">
                    {i.nameFr} × {i.qty}
                  </span>
                  <span className="font-bold whitespace-nowrap">
                    {formatDzd(i.priceDzd * i.qty, locale)}
                  </span>
                </div>
              ))}
              <div className="border-t border-outline-variant pt-3 flex justify-between">
                <span className="text-on-surface-variant">{tc("subtotal")}</span>
                <span className="font-bold">{formatDzd(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{tc("shipping")}</span>
                <span className="font-bold">{formatDzd(shipping, locale)}</span>
              </div>
              <div className="border-t border-outline-variant pt-3 flex justify-between">
                <span className="font-bold uppercase">{tc("total")}</span>
                <span className="font-black text-primary text-xl">
                  {formatDzd(total, locale)}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? tc("loading") : t("placeOrder")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
