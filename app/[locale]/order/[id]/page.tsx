"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Link } from "@/lib/i18n/routing";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrackingTimeline } from "@/components/order/TrackingTimeline";
import { formatDzd, localizedName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const tt = useTranslations("tracking");

  const order = useQuery(api.orders.byId, id ? ({ id: id as any }) : "skip");

  if (order === undefined) {
    return <div className="container-zed py-24 text-center">{tc("loading")}</div>;
  }
  if (order === null) {
    return <div className="container-zed py-24 text-center">{tc("error")}</div>;
  }

  const statusVariant: Record<string, "primary" | "success" | "warning" | "error" | "muted"> = {
    pending: "warning",
    confirmed: "primary",
    preparing: "primary",
    shipping: "primary",
    delivered: "success",
    cancelled: "error",
  };

  return (
    <div className="container-zed py-12 lg:py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Icon name="check_circle" filled className="text-6xl text-green-600 mb-4" />
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase">
            {t("orderSuccess")}
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            {t("thankYouMessage")}
          </p>
          <p className="text-on-surface-variant mt-4">
            {t("orderNumber")}:{" "}
            <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
          </p>
          <div className="mt-4">
            <Badge variant={statusVariant[order.status]}>{tt(order.status)}</Badge>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />
          <h2 className="font-bold uppercase tracking-widest text-xs mb-6">
            {tc("total")}
          </h2>
          <div className="space-y-4 mb-6">
            {order.items.map((i: any, idx: number) => {
              const colorName = i.selectedColor
                ? (locale === "ar" ? i.selectedColor.nameAr : i.selectedColor.nameFr) ||
                  i.selectedColor.nameFr ||
                  i.selectedColor.nameAr ||
                  i.selectedColor.hex
                : "";
              return (
                <div
                  key={idx}
                  className="flex justify-between pb-4 border-b border-outline-variant"
                >
                  <div>
                    <div className="font-bold">{localizedName(i, locale)}</div>
                    {i.selectedColor && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="inline-block w-3 h-3 rounded-full ring-1 ring-outline-variant/60"
                          style={{ backgroundColor: i.selectedColor.hex }}
                          aria-hidden
                        />
                        <span className="text-xs text-on-surface-variant">
                          {colorName}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-on-surface-variant">
                      {tc("quantity")}: {i.qty}
                    </div>
                  </div>
                  <span className="font-black">
                    {formatDzd(i.priceDzd * i.qty, locale)}
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{tc("subtotal")}</span>
              <span className="font-bold">{formatDzd(order.subtotalDzd, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{tc("shipping")}</span>
              <span className="font-bold">{formatDzd(order.shippingDzd, locale)}</span>
            </div>
            <div className="border-t border-outline-variant pt-4 flex justify-between">
              <span className="font-bold uppercase">{tc("total")}</span>
              <span className="font-black text-primary text-2xl">
                {formatDzd(order.totalDzd, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking timeline */}
        <div className="bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-6 lg:p-8 mt-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />

          {(order.trackingNumber || order.estimatedDelivery) && (
            <div className="bg-surface-container rounded-2xl p-4 mb-6 space-y-2">
              {order.trackingNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{t("orderNumber")}</span>
                  <span className="font-mono font-bold">{order.trackingNumber}</span>
                </div>
              )}
              {order.carrierTrackingUrl && (
                <a
                  href={order.carrierTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline"
                >
                  <Icon name="open_in_new" className="text-base" />
                  {tc("continue")}
                </a>
              )}
            </div>
          )}

          <TrackingTimeline
            currentStatus={order.status}
            statusHistory={order.statusHistory}
          />
        </div>

        <div className="text-center mt-12">
          <Link href="/shop">
            <Button variant="outline">{tc("continue")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
