import { CarrierAdapter, CarrierCredentials, Desk, ShipmentData } from "./types";

const BASE = "https://app.noest-dz.com/api/public";

function auth(creds: CarrierCredentials) {
  return {
    api_token: creds.apiToken ?? "",
    user_guid: creds.userGuid ?? "",
  };
}

async function postForm(url: string, body: Record<string, any>) {
  const params = new URLSearchParams();
  for (const [k, val] of Object.entries(body)) {
    if (val === undefined || val === null) continue;
    params.append(k, String(val));
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: params.toString(),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "object" ? data?.message ?? JSON.stringify(data) : String(data);
    throw new Error(`Noest ${res.status}: ${msg}`);
  }
  return data;
}

async function getJson(url: string, params: Record<string, any>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    qs.append(k, String(v));
  }
  const res = await fetch(`${url}?${qs.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "object" ? data?.message ?? JSON.stringify(data) : String(data);
    throw new Error(`Noest ${res.status}: ${msg}`);
  }
  return data;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Noest expects 9-10 digits; Algerian mobile usually 10 (e.g. 0555123456) or 9 without leading 0
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function createNoestAdapter(creds: CarrierCredentials): CarrierAdapter {
  return {
    async testConnection() {
      try {
        await getJson(`${BASE}/desks`, auth(creds));
        return true;
      } catch {
        return false;
      }
    },

    async getFees(_fromWilaya, toWilaya, opts) {
      const data = await getJson(`${BASE}/fees`, auth(creds));
      const tarif = data?.tarifs?.delivery?.[String(toWilaya)];
      if (!tarif) return 0;
      const raw = opts?.stopDesk ? tarif.tarif_stopdesk : tarif.tarif;
      return Number(raw) || 0;
    },

    async getDesks(): Promise<Desk[]> {
      const data = await getJson(`${BASE}/desks`, auth(creds));
      const out: Desk[] = [];
      for (const [key, info] of Object.entries<any>(data ?? {})) {
        // key is padded e.g. "01A" → wilaya 1, "16A" → 16
        const wilayaId = parseInt(key.slice(0, 2), 10);
        out.push({
          code: info.code ?? key,
          name: info.name ?? key,
          address: info.address,
          wilayaId: Number.isFinite(wilayaId) ? wilayaId : undefined,
        });
      }
      return out;
    },

    async createShipment(order: ShipmentData) {
      const wilayaNum = parseInt(order.wilaya, 10) || 0;
      const stopDesk = order.deliveryType === "stopdesk" ? 1 : 0;
      const payload: Record<string, any> = {
        ...auth(creds),
        reference: order.orderNumber,
        client: order.customerName,
        phone: normalizePhone(order.phone),
        adresse: order.address || "—",
        wilaya_id: wilayaNum,
        commune: order.commune || "—",
        montant: order.isCod ? order.totalAmount : 0,
        produit: order.productSummary || order.orderNumber,
        type_id: 1, // 1 = livraison standard
        poids: Math.max(1, Math.round(order.weight ?? 1)),
        stop_desk: stopDesk,
        can_open: 0,
      };
      if (stopDesk === 1 && order.stationCode) {
        payload.station_code = order.stationCode;
      }
      const data = await postForm(`${BASE}/create/order`, payload);
      const tracking = data?.tracking ?? "";
      if (!tracking) throw new Error(`Noest: no tracking returned (${JSON.stringify(data)})`);
      return { tracking };
    },

    getTrackingUrl(tracking: string) {
      return `https://app.noest-dz.com/suivi/${tracking}`;
    },
  };
}
