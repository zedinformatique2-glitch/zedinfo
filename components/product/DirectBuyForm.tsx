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

  useEffect(() => {
    setValue("commune", "");
    setDynamicShipping(null);

    if (!wilaya) return;
    const defaultCarrier = (enabledCarriers ?? []).find(
      (c: any) => c.isDefault && c.hasApi && c.credentials
    );
    if (!defaultCarrier) return;

    const wilayaNum = getWilayaNumber(wilaya);
    if (wilayaNum === 0) return;

    let cancelled = false;
    setFetchingFees(true);
    getCarrierFees({
      slug: defaultCarrier.slug,
      credentials: defaultCarrier.credentials!,
      fromWilaya: 17,
      toWilaya: wilayaNum,
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
  }, [wilaya, enabledCarriers]);

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
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold uppercase tracking-widest text-xs">
              {td("title")}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
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
                <Input {...register("phone")} type="tel" />
                {errors.phone && (
                  <p className="text-error text-xs mt-1">
                    {errors.phone.message}
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

            {/* Payment method */}
            <div className="space-y-2">
              <Label>{t("paymentMethod")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-surface ring-1 ring-outline-variant/60 cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 transition-all">
                  <input
                    type="radio"
                    value="cod"
                    {...register("paymentMethod")}
                  />
                  <Icon name="payments" className="text-primary text-sm" />
                  <span className="font-bold uppercase text-[10px]">
                    {t("cod")}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl bg-surface ring-1 ring-outline-variant/60 cursor-pointer hover:ring-primary/40 has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20 transition-all">
                  <input
                    type="radio"
                    value="whatsapp"
                    {...register("paymentMethod")}
                  />
                  <Icon name="chat" className="text-primary text-sm" />
                  <span className="font-bold uppercase text-[10px]">
                    {t("whatsapp")}
                  </span>
                </label>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="truncate max-w-[60%]">
                  {productName} × 1
                </span>
                <span className="font-bold">
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
