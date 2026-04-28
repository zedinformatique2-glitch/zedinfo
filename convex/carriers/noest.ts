import { CarrierAdapter, CarrierCredentials, Desk, ShipmentData } from "./types";

const BASE = "https://app.noest-dz.com/api/public";

function authHeaders(creds: CarrierCredentials) {
  return {
    Authorization: `Bearer ${creds.apiToken ?? ""}`,
    Accept: "application/json",
  };
}

async function getJson(path: string, creds: CarrierCredentials) {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: authHeaders(creds),
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

async function postJson(path: string, creds: CarrierCredentials, body: Record<string, any>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...authHeaders(creds), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "object"
      ? (data?.message ?? JSON.stringify(data))
      : String(data);
    throw new Error(`Noest ${res.status}: ${msg}`);
  }
  return data;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function ensureReference(orderNumber: string): string {
  // Noest requires reference >= 5 chars; our format ZED-YYMMDD-#### is always >= 13.
  return orderNumber.length >= 5 ? orderNumber : `${orderNumber}-${Date.now()}`.slice(0, 30);
}

export function createNoestAdapter(creds: CarrierCredentials): CarrierAdapter {
  return {
    async testConnection() {
      try {
        await getJson("/desks", creds);
        return true;
      } catch {
        return false;
      }
    },

    async getFees(_fromWilaya, toWilaya, opts) {
      const data = await getJson("/fees", creds);
      const tarif = data?.tarifs?.delivery?.[String(toWilaya)];
      if (!tarif) return 0;
      const raw = opts?.stopDesk ? tarif.tarif_stopdesk : tarif.tarif;
      return Number(raw) || 0;
    },

    async getDesks(): Promise<Desk[]> {
      const data = await getJson("/desks", creds);
      const out: Desk[] = [];
      for (const [key, info] of Object.entries<any>(data ?? {})) {
        // key like "01A", "16E", "19RE" — first 2 chars are wilaya number
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
      if (!creds.userGuid) throw new Error("Noest: user_guid manquant dans les identifiants");
      const wilayaNum = parseInt(order.wilaya, 10) || 0;
      const stopDesk = order.deliveryType === "stopdesk" ? 1 : 0;

      const payload: Record<string, any> = {
        user_guid: creds.userGuid,
        reference: ensureReference(order.orderNumber),
        client: order.customerName,
        phone: normalizePhone(order.phone),
        adresse: (order.address && order.address.length > 0) ? order.address.slice(0, 255) : "—",
        wilaya_id: wilayaNum,
        montant: order.isCod ? order.totalAmount : 0,
        produit: (order.productSummary || order.orderNumber).slice(0, 240),
        type_id: 1,
        stop_desk: stopDesk,
      };

      if (order.weight && order.weight > 0) payload.poids = order.weight;
      if (stopDesk === 1) {
        if (!order.stationCode) throw new Error("Noest: station_code requis pour le stop desk");
        payload.station_code = order.stationCode;
      } else {
        // commune is required when stop_desk is 0 and zip_code is not provided
        payload.commune = (order.commune && order.commune.length > 0) ? order.commune : "—";
      }

      const data = await postJson("/create/order", creds, payload);
      const tracking = data?.tracking ?? "";
      if (!tracking) {
        throw new Error(`Noest: tracking absent (${JSON.stringify(data)})`);
      }
      return { tracking };
    },

    getTrackingUrl(tracking: string) {
      return `https://app.noest-dz.com/suivi/${tracking}`;
    },
  };
}
