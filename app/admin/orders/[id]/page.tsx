"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { ar } from "@/lib/admin-i18n";

const STATUSES = ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"] as const;

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const order = useQuery(api.orders.byId, { id: id as any });
  const enabledCarriers = useQuery(api.delivery.getEnabledCarriers);
  const updateStatus = useMutation(api.orders.updateStatus);
  const updateTracking = useMutation(api.orders.updateTracking);
  const createShipment = useAction(api.delivery.createShipment);

  const [statusNote, setStatusNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [carrierTrackingUrl, setCarrierTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [trackingInited, setTrackingInited] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState("");

  if (!order) return <div className="p-8">{ar.dashboard.loading}</div>;

  if (!trackingInited) {
    setTrackingNumber(order.trackingNumber ?? "");
    const defaultApi = (enabledCarriers ?? []).find((c: any) => c.isDefault && c.hasApi && c.credentials);
    setCarrier(order.carrier ?? defaultApi?.slug ?? "");
    setCarrierTrackingUrl(order.carrierTrackingUrl ?? "");
    setEstimatedDelivery(order.estimatedDelivery ?? "");
    if (enabledCarriers !== undefined) setTrackingInited(true);
  }

  const phoneE164 = order.customer.phone.replace(/[^0-9+]/g, "");

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus({
      id: order._id,
      status: newStatus as any,
      note: statusNote || undefined,
    });
    setStatusNote("");
  };

  const handleTrackingSave = async () => {
    await updateTracking({
      id: order._id,
      trackingNumber: trackingNumber || undefined,
      carrier: carrier || undefined,
      carrierTrackingUrl: carrierTrackingUrl || undefined,
      estimatedDelivery: estimatedDelivery || undefined,
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">
          {ar.orderDetail.order}
        </div>
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter font-mono">
          {order.orderNumber}
        </h1>
        <div className="text-xs text-on-surface-variant mt-2">
          {formatDateTime(order.createdAt)}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
            <h2 className="font-black tracking-tight mb-4">{ar.orderDetail.items}</h2>
            <div className="space-y-3">
              {order.items.map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between py-2 border-b border-outline-variant">
                  <div>
                    <div className="font-bold">{i.nameFr}</div>
                    <div className="text-xs text-on-surface-variant">{ar.orderDetail.qty}: {i.qty}</div>
                  </div>
                  <div className="font-black">{formatDzd(i.priceDzd * i.qty)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-outline-variant pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{ar.orderDetail.subtotal}</span>
                <span className="font-bold">{formatDzd(order.subtotalDzd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{ar.orderDetail.shipping}</span>
                <span className="font-bold">{formatDzd(order.shippingDzd)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-outline-variant">
                <span className="font-bold">{ar.orderDetail.total}</span>
                <span className="text-primary font-black text-xl">
                  {formatDzd(order.totalDzd)}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
            <h2 className="font-black tracking-tight mb-4">{ar.orderDetail.tracking}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                  {ar.orderDetail.carrier}
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">{ar.orderDetail.selectCarrier}</option>
                  {(enabledCarriers ?? []).map((c: any) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                  <option value="custom">{ar.orderDetail.custom}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                  {ar.orderDetail.trackingNumber}
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                  {ar.orderDetail.trackingUrl}
                </label>
                <input
                  type="url"
                  value={carrierTrackingUrl}
                  onChange={(e) => setCarrierTrackingUrl(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                  {ar.orderDetail.estimatedDelivery}
                </label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={handleTrackingSave}
                className="rounded-xl bg-primary text-white px-6 py-2.5 text-xs font-bold shadow-card hover:brightness-110 hover:-translate-y-0.5 transition-all"
              >
                {ar.orderDetail.saveTracking}
              </button>
              {(() => {
                const selectedCarrier = (enabledCarriers ?? []).find((c: any) => c.slug === carrier);
                if (!selectedCarrier?.hasApi || !selectedCarrier?.credentials) return null;
                return (
                  <button
                    type="button"
                    disabled={creatingShipment}
                    onClick={async () => {
                      setCreatingShipment(true);
                      setShipmentError("");
                      try {
                        const { getWilayaNumber } = await import("@/lib/wilayas");
                        const wilayaNum = getWilayaNumber(order.customer.wilaya);
                        const result = await createShipment({
                          slug: selectedCarrier.slug,
                          credentials: selectedCarrier.credentials!,
                          shipment: {
                            orderNumber: order.orderNumber,
                            customerName: order.customer.fullName,
                            phone: order.customer.phone,
                            address: order.customer.address,
                            wilaya: selectedCarrier.slug === "noest" ? String(wilayaNum) : order.customer.wilaya,
                            commune: order.customer.commune || undefined,
                            totalAmount: order.totalDzd,
                            isCod: order.paymentMethod === "cod",
                            deliveryType: order.deliveryType,
                            stationCode: order.stationCode,
                            productSummary: order.items.map((i: any) => `${i.nameFr} x${i.qty}`).join(", ").slice(0, 240),
                          },
                        });
                        if (result.error) {
                          setShipmentError(result.error);
                        } else {
                          setTrackingNumber(result.tracking);
                          setCarrierTrackingUrl("trackingUrl" in result ? (result.trackingUrl ?? "") : "");
                        }
                      } catch (e: any) {
                        setShipmentError(e.message);
                      }
                      setCreatingShipment(false);
                    }}
                    className="rounded-xl bg-green-600 text-white px-6 py-2.5 text-xs font-bold shadow-card hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {creatingShipment ? ar.orderDetail.creating : ar.orderDetail.createShipment}
                  </button>
                );
              })()}
            </div>
            {shipmentError && (
              <div className="mt-3 rounded-xl bg-red-50 text-red-800 text-xs p-3">
                {shipmentError}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
            <h2 className="font-black tracking-tight mb-4">{ar.orderDetail.status}</h2>
            <div className="mb-4">
              <Badge variant={order.status === "delivered" ? "success" : order.status === "cancelled" ? "error" : "primary"}>
                {ar.status[order.status] || order.status}
              </Badge>
            </div>
            <Select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ar.status[s]}
                </option>
              ))}
            </Select>
            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                {ar.orderDetail.statusNote}
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={ar.orderDetail.addContext}
                className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mt-4 border-t border-outline-variant pt-3">
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  {ar.orderDetail.history}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...order.statusHistory].reverse().map((entry: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="muted" className="text-[8px]">{ar.status[entry.status] || entry.status}</Badge>
                        <span className="text-on-surface-variant">
                          {new Date(entry.timestamp).toLocaleString("ar")}
                        </span>
                      </div>
                      {entry.note && (
                        <div className="text-on-surface-variant italic ms-2 mt-0.5">
                          {entry.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
            <h2 className="font-black tracking-tight mb-4">{ar.orderDetail.customerInfo}</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {ar.orderDetail.name}
                </dt>
                <dd className="font-bold">{order.customer.fullName}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {ar.orderDetail.phone}
                </dt>
                <dd className="font-bold" dir="ltr">{order.customer.phone}</dd>
              </div>
              {order.customer.email && (
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {ar.orderDetail.email}
                  </dt>
                  <dd className="font-bold">{order.customer.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {ar.orderDetail.wilaya}
                </dt>
                <dd className="font-bold">{order.customer.wilaya}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {ar.orderDetail.address}
                </dt>
                <dd>{order.customer.address}</dd>
              </div>
              {order.customer.notes && (
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {ar.orderDetail.notes}
                  </dt>
                  <dd>{order.customer.notes}</dd>
                </div>
              )}
            </dl>
            <div className="flex gap-2 mt-4">
              <a
                href={`tel:${phoneE164}`}
                className="flex-1 rounded-xl bg-primary text-white py-3 text-center text-xs font-bold shadow-card hover:brightness-110 hover:-translate-y-0.5 transition-all"
              >
                {ar.orderDetail.call}
              </a>
              <a
                href={`https://wa.me/${phoneE164.replace("+", "")}`}
                target="_blank"
                className="flex-1 rounded-xl bg-green-600 text-white py-3 text-center text-xs font-bold shadow-card hover:brightness-110 hover:-translate-y-0.5 transition-all"
              >
                {ar.orderDetail.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
