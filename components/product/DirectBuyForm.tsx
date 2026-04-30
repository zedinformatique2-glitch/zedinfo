"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  WILAYAS_BILINGUAL,
  getCommunesForWilaya,
  getShippingCost,
  getWilayaNumber,
} from "@/lib/wilayas";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDzd, localizedName } from "@/lib/format";
import { isValidDzMobile, normalizeDzPhone, DZ_PHONE_ERROR } from "@/lib/phone";
import type { Locale } from "@/lib/i18n/config";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z
    .string()
    .transform((v) => normalizeDzPhone(v))
    .refine(isValidDzMobile, { message: "DZ_PHONE" }),
  wilaya: z.string().min(1),
  commune: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cod", "whatsapp"]),
  deliveryType: z.enum(["home", "stopdesk"]),
  stationCode: z.string().optional(),
}).refine((d) => d.deliveryType !== "stopdesk" || (d.stationCode && d.stationCode.length > 0), {
  message: "STATION_REQUIRED",
  path: ["stationCode"],
});

type FormData = z.infer<typeof schema>;

type Product = {
  _id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  priceDzd: number;
  images: string[];
  stock: number;
};

export function DirectBuyForm({ product }: { product: Product }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const td = useTranslations("directBuy");

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dynamicShipping, setDynamicShipping] = useState<number | null>(null);
  const [fetchingFees, setFetchingFees] = useState(false);

  const createOrder = useMutation(api.orders.create);
  const enabledCarriers = useQuery(api.delivery.getEnabledCarriers);
  const getCarrierFees = useAction(api.delivery.getFees);
  const getCarrierDesks = useAction(api.delivery.getDesks);

  const [desks, setDesks] = useState<{ code: string; name: string; address?: string; wilayaId?: number }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "cod", deliveryType: "home" },
  });

  const wilaya = watch("wilaya");
  const deliveryType = watch("deliveryType");
  const communes = wilaya ? getCommunesForWilaya(wilaya) : [];

  const defaultApiCarrier = (enabledCarriers ?? []).find(
    (c: any) => c.isDefault && c.hasApi && c.credentials
  );

  // Load desks once when carrier ready
  useEffect(() => {
    if (!defaultApiCarrier) { setDesks([]); return; }
    let cancelled = false;
    getCarrierDesks({
      slug: defaultApiCarrier.slug,
      credentials: defaultApiCarrier.credentials!,
    }).then((res: any) => {
      if (!cancelled && res.desks) setDesks(res.desks);
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultApiCarrier?.slug]);

  useEffect(() => {
    setValue("commune", "");
    setValue("stationCode", "");
    setDynamicShipping(null);

    if (!wilaya) return;
    if (!defaultApiCarrier) return;

    const wilayaNum = getWilayaNumber(wilaya);
    if (wilayaNum === 0) return;

    let cancelled = false;
    setFetchingFees(true);
    getCarrierFees({
      slug: defaultApiCarrier.slug,
      credentials: defaultApiCarrier.credentials!,
      fromWilaya: 17,
      toWilaya: wilayaNum,
      stopDesk: deliveryType === "stopdesk",
    })
      .then((result: any) => {
        if (!cancelled && result.fee > 0) {
          setDynamicShipping(result.fee);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetchingFees(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wilaya, deliveryType, defaultApiCarrier?.slug]);

  const wilayaNumForDesks = wilaya ? getWilayaNumber(wilaya) : 0;
  const desksForWilaya = wilayaNumForDesks ? desks.filter((d) => d.wilayaId === wilayaNumForDesks) : [];

  const shipping = dynamicShipping ?? (wilaya ? getShippingCost(wilaya) : 800);
  const subtotal = product.priceDzd;
  const total = subtotal + shipping;

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const item = {
        productId: product._id as any,
        slug: product.slug,
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        priceDzd: product.priceDzd,
        qty: 1,
        image: product.images[0] || "",
      };

      const result = await createOrder({
        items: [item],
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
        deliveryType: data.deliveryType,
        stationCode: data.deliveryType === "stopdesk" ? data.stationCode : undefined,
      });

      if (data.paymentMethod === "whatsapp") {
        const phone =
          process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "213663287772";
        const url = buildWhatsAppUrl({
          phoneNumber: phone,
          orderNumber: result.orderNumber,
          items: [item],
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
        window.location.href = url;
        return;
      }

      router.push(`/order/${result.id}`);
    } catch (err) {
      alert(tc("error"));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const productName = localizedName(product, locale);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-surface-container-low ring-1 ring-outline-variant/60 px-8 py-4 font-bold uppercase tracking-widest text-xs text-primary hover:bg-primary-fixed/20 hover:ring-primary/40 transition-all"
      >
        <Icon name="flash_on" className="text-lg" />
        {tc("buyNow")}
      </button>
    );
  }

  return (
    <div className="mt-3">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden">
        <div className="bg-gradient-to-r from-primary via-primary-container to-primary h-1" />
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold uppercase tracking-widest text-xs">
              {td("title")}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tc("close") || "Close"}
              className="-me-2 -mt-2 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <Icon name="close" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("fullName")}</Label>
                <Input {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-error text-xs mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label>{t("phone")}</Label>
                <Input
                  {...register("phone")}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="0555 12 34 56"
                  maxLength={14}
                />
                {errors.phone && (
                  <p className="text-error text-xs mt-1">
                    {DZ_PHONE_ERROR[(locale as "fr" | "ar" | "en")] ?? DZ_PHONE_ERROR.fr}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping */}
            <div className="grid sm:grid-cols-2 gap-3">
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
                  <option value="">
                    {wilaya ? "—" : t("communePlaceholder")}
                  </option>
                  {communes.map((c) => (
                    <option key={c.fr} value={c.fr}>
                      {locale === "ar" ? `${c.ar} — ${c.fr}` : c.fr}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{t("address")}</Label>
                <Input {...register("address")} />
              </div>
              <div>
                <Label>{t("notes")}</Label>
                <Textarea {...register("notes")} rows={2} />
              </div>
            </div>

            {/* Delivery type */}
            <div className="space-y-2">
              <Label>{t("deliveryType")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center gap-1.5 p-3 text-center rounded-xl bg-surface ring-1 ring-outline-variant/60 cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary transition-all">
                  <input type="radio" value="home" {...register("deliveryType")} className="sr-only" />
                  <Icon name="home" className="text-primary text-xl" />
                  <span className="font-bold uppercase text-[10px] leading-tight">{t("homeDelivery")}</span>
                </label>
                <label className="flex flex-col items-center justify-center gap-1.5 p-3 text-center rounded-xl bg-surface ring-1 ring-outline-variant/60 cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary transition-all">
                  <input type="radio" value="stopdesk" {...register("deliveryType")} className="sr-only" />
                  <Icon name="storefront" className="text-primary text-xl" />
                  <span className="font-bold uppercase text-[10px] leading-tight">{t("stopDesk")}</span>
                </label>
              </div>
              {deliveryType === "stopdesk" && (
                <div>
                  <Label>{t("station")}</Label>
                  <Select {...register("stationCode")} disabled={!wilaya || desksForWilaya.length === 0}>
                    <option value="">
                      {!wilaya
                        ? t("stationPickWilayaFirst")
                        : desksForWilaya.length === 0
                          ? t("stationNone")
                          : "—"}
                    </option>
                    {desksForWilaya.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}{d.address ? ` — ${d.address}` : ""}
                      </option>
                    ))}
                  </Select>
                  {errors.stationCode && (
                    <p className="text-error text-xs mt-1">{t("stationRequired")}</p>
                  )}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>{t("paymentMethod")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center gap-1.5 p-3 text-center rounded-xl bg-surface ring-1 ring-outline-variant/60 cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary transition-all">
                  <input
                    type="radio"
                    value="cod"
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  <Icon name="payments" className="text-primary text-xl" />
                  <span className="font-bold uppercase text-[10px] leading-tight">
                    {t("cod")}
                  </span>
                </label>
                <label className="flex flex-col items-center justify-center gap-1.5 p-3 text-center rounded-xl bg-surface ring-1 ring-outline-variant/60 cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary transition-all">
                  <input
                    type="radio"
                    value="whatsapp"
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  <Icon name="chat" className="text-primary text-xl" />
                  <span className="font-bold uppercase text-[10px] leading-tight">
                    {t("whatsapp")}
                  </span>
                </label>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="line-clamp-2 break-words flex-1 min-w-0">
                  {productName} × 1
                </span>
                <span className="font-bold whitespace-nowrap shrink-0">
                  {formatDzd(subtotal, locale)}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>{tc("shipping")}</span>
                <span className="font-bold">
                  {fetchingFees ? "..." : formatDzd(shipping, locale)}
                </span>
              </div>
              <div className="border-t border-outline-variant pt-2 flex justify-between">
                <span className="font-bold uppercase text-xs">
                  {tc("total")}
                </span>
                <span className="font-black text-primary">
                  {formatDzd(total, locale)}
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? tc("loading") : t("placeOrder")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
