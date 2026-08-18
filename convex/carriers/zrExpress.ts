import { CarrierAdapter, CarrierCredentials, Desk, ShipmentData } from "./types";

// New ZR Express API (api.zrexpress.app), NOT the old procolis.com one.
// Auth: two headers — X-Tenant (tenant UUID) + X-Api-Key (secret API key).
//   creds.apiId    => X-Tenant  (Tenant ID — a UUID, found in the portal / profile.memberships)
//   creds.apiToken => X-Api-Key (the secret API key generated under "API Rest > Token API")
const BASE = "https://api.zrexpress.app/api/v1";

// ZR rejects any parcel whose collected amount exceeds this.
const MAX_AMOUNT = 150000;

function headers(creds: CarrierCredentials): Record<string, string> {
  // Trim: values are pasted by hand in /admin/delivery and a stray space or
  // newline in a header value is rejected outright.
  return {
    "X-Tenant": (creds.apiId ?? "").trim(),
    "X-Api-Key": (creds.apiToken ?? "").trim(),
    Accept: "application/json",
  };
}

function formatError(data: any): string {
  if (data == null) return "réponse vide";
  if (typeof data !== "object") return String(data);
  // RFC7807 problem+json: { title, detail, errors? }
  if (data.errors && typeof data.errors === "object") {
    const parts: string[] = [];
    for (const [field, msgs] of Object.entries<any>(data.errors)) {
      const list = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      parts.push(`${field}: ${list}`);
    }
    if (parts.length > 0) return parts.join(" | ");
  }
  return data.detail ?? data.title ?? data.message ?? JSON.stringify(data);
}

async function call(
  method: "GET" | "POST",
  path: string,
  creds: CarrierCredentials,
  body?: Record<string, any>,
) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body
      ? { ...headers(creds), "Content-Type": "application/json" }
      : headers(creds),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (res.status === 401) {
    // ZR answers "Invalid API Key" on every endpoint when the key itself is
    // rejected (revoked/regenerated in the portal), so point at the real fix.
    throw new Error(
      "ZR Express refuse la clé API (401). Régénère le token dans le portail ZR " +
        "(API Rest > Token API), colle-le dans Livraison > ZR Express > API Key, " +
        "puis clique « Tester la connexion » avant de recréer l'expédition.",
    );
  }
  if (!res.ok) {
    throw new Error(`ZR Express ${res.status}: ${formatError(data)}`);
  }
  return data;
}

// --- Helpers -------------------------------------------------------------

/** Normalize a place name for matching: strip accents/punctuation, lowercase. */
function norm(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip Latin diacritics
    .replace(/['’]/g, "") // drop apostrophes so "M'Sila" == "MSila"
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ") // keep latin alnum + Arabic block
    .trim();
}

/** Algerian phone -> +213XXXXXXXXX international format. */
function toIntlPhone(raw: string): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("213")) return "+" + d;
  if (d.startsWith("0")) d = d.slice(1);
  return "+213" + d;
}

function uuid(): string {
  try {
    // Available in the Convex action runtime.
    return (crypto as any).randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// --- Territory directory (wilaya/commune -> UUID) ------------------------

type Commune = { id: string; parentId: string; canSend: boolean };

type TerritoryIndex = {
  // normalized wilaya name (FR or AR) -> wilaya UUID
  wilayaByName: Map<string, string>;
  // official wilaya code (1..58) -> wilaya UUID
  wilayaByCode: Map<number, string>;
  // wilaya UUID -> (normalized commune name -> commune)
  communesByWilaya: Map<string, Map<string, Commune>>;
  // normalized commune name -> commune (global; for daïra-as-wilaya fallback)
  communeByName: Map<string, Commune>;
};

// The site lists 69 "wilayas" with a few non-standard spellings; map them to
// ZR's wilaya names (normalized) where neither name nor commune fallback hits.
const WILAYA_ALIAS: Record<string, string> = {
  algiers: "alger",
  "el mghair": "el meghaier",
};

// Per-tenant cache, warm across invocations on the same Convex instance.
const territoryCache = new Map<string, { at: number; idx: TerritoryIndex }>();
const TERRITORY_TTL = 1000 * 60 * 60; // 1h

async function loadTerritories(creds: CarrierCredentials): Promise<TerritoryIndex> {
  const key = creds.apiId ?? "";
  const cached = territoryCache.get(key);
  if (cached && Date.now() - cached.at < TERRITORY_TTL) return cached.idx;

  const wilayaByName = new Map<string, string>();
  const wilayaByCode = new Map<number, string>();
  const communesByWilaya = new Map<string, Map<string, Commune>>();
  const communeByName = new Map<string, Commune>();

  let page = 1;
  // Cap pages defensively; ~1600 rows at 1000/page = 2 pages.
  for (; page <= 10; page++) {
    const data = await call("POST", "/territories/search", creds, {
      pageNumber: page,
      pageSize: 1000,
    });
    const items: any[] = data?.items ?? [];
    for (const t of items) {
      if (t.level === "wilaya") {
        if (t.name) wilayaByName.set(norm(t.name), t.id);
        if (t.nameArabic) wilayaByName.set(norm(t.nameArabic), t.id);
        if (typeof t.code === "number") wilayaByCode.set(t.code, t.id);
      } else if (t.level === "commune" && t.parentId) {
        let m = communesByWilaya.get(t.parentId);
        if (!m) {
          m = new Map();
          communesByWilaya.set(t.parentId, m);
        }
        const entry: Commune = {
          id: t.id,
          parentId: t.parentId,
          canSend: t.delivery?.canSend !== false,
        };
        if (t.name) {
          m.set(norm(t.name), entry);
          if (!communeByName.has(norm(t.name))) communeByName.set(norm(t.name), entry);
        }
        if (t.nameArabic) m.set(norm(t.nameArabic), entry);
      }
    }
    if (!data?.hasNext) break;
  }

  const idx: TerritoryIndex = { wilayaByName, wilayaByCode, communesByWilaya, communeByName };
  territoryCache.set(key, { at: Date.now(), idx });
  return idx;
}

// --- Adapter -------------------------------------------------------------

export function createZrExpressAdapter(creds: CarrierCredentials): CarrierAdapter {
  return {
    async testConnection() {
      // Profile only needs the API key; use it to also validate the tenant ID.
      const data = await call("GET", "/users/profile", creds);
      const tenant = creds.apiId ?? "";
      const memberships: any[] = data?.memberships ?? [];
      if (tenant && memberships.length > 0) {
        const ids = memberships.map((m) => m.tenantId);
        if (!ids.includes(tenant)) {
          const list = memberships
            .map((m) => `${m.tenantName} (${m.tenantId})`)
            .join(", ");
          throw new Error(
            `Clé valide mais Tenant ID incorrect. Votre Tenant ID: ${list}`,
          );
        }
      }
      return true;
    },

    async getFees(_fromWilaya, toWilaya, opts) {
      const data = await call("GET", "/delivery-pricing/rates", creds);
      const rates: any[] = data?.rates ?? [];
      const wanted = opts?.stopDesk ? "pickup-point" : "home";
      const priceOf = (row: any): number => {
        const p = (row?.deliveryPrices ?? []).find((x: any) => x.deliveryType === wanted);
        return Number(p?.discountedPrice ?? p?.price ?? 0) || 0;
      };

      const wilayaFee = priceOf(
        rates.find(
          (r) => r.toTerritoryLevel === "wilaya" && Number(r.toTerritoryCode) === Number(toWilaya),
        ),
      );
      if (wilayaFee > 0) return wilayaFee;

      // No wilaya-level rate. ZR prices some wilayas per commune instead —
      // notably Djelfa, where the shop is, at 500 home / 370 pickup. Without
      // this branch those fall through to the flat 800 in lib/wilayas.ts.
      //
      // The commune rows in /delivery-pricing/rates carry no wilaya code, so
      // match them by territory UUID: resolving the wilaya code through the
      // territory directory avoids picking a same-named commune in another
      // wilaya (Algeria has plenty).
      const idx = await loadTerritories(creds);
      const wilayaId = idx.wilayaByCode.get(Number(toWilaya));
      if (!wilayaId) return 0;
      const communes = idx.communesByWilaya.get(wilayaId);
      if (!communes) return 0;

      if (opts?.commune) {
        const hit = communes.get(norm(opts.commune));
        if (hit) {
          const fee = priceOf(rates.find((r) => r.toTerritoryId === hit.id));
          if (fee > 0) return fee;
        }
      }

      // Commune not chosen yet (the checkout resets it when the wilaya
      // changes) or not priced individually: quote the wilaya's highest
      // commune rate so we never under-quote, then refine once it's picked.
      const ids = new Set([...communes.values()].map((c) => c.id));
      const fees = rates
        .filter((r) => ids.has(r.toTerritoryId))
        .map(priceOf)
        .filter((f) => f > 0);
      return fees.length > 0 ? Math.max(...fees) : 0;
    },

    // ZR calls its stop desks "hubs". Only those flagged `isPickupPoint` can
    // receive a parcel for customer collection; the rest are sorting centres.
    // The hub's address carries `cityTerritoryId`, i.e. the wilaya UUID, so the
    // 1-58 code comes straight from the territory directory — no name matching.
    async getDesks(): Promise<Desk[]> {
      const idx = await loadTerritories(creds);
      const codeByWilayaId = new Map<string, number>();
      for (const [code, id] of idx.wilayaByCode) codeByWilayaId.set(id, code);

      const out: Desk[] = [];
      for (let page = 1; page <= 10; page++) {
        const data = await call("POST", "/hubs/search", creds, {
          pageNumber: page,
          pageSize: 200,
        });
        const items: any[] = data?.items ?? [];
        for (const h of items) {
          if (!h?.isPickupPoint) continue;
          const a = h.address ?? {};
          out.push({
            // The parcel payload wants the hub UUID, so that is what we store
            // as the order's stationCode.
            code: h.id,
            name: h.name || a.district || a.city || h.id,
            address: [a.street, a.district, a.city].filter(Boolean).join(", ") || undefined,
            wilayaId: codeByWilayaId.get(a.cityTerritoryId),
          });
        }
        if (!data?.hasNext) break;
      }
      return out;
    },

    async createShipment(order: ShipmentData) {
      if (!creds.apiId) throw new Error("ZR Express: Tenant ID manquant dans les identifiants");
      if (!creds.apiToken) throw new Error("ZR Express: API Key manquante dans les identifiants");

      // Pickup-point parcels are addressed by hub, not by commune: ZR wants
      // `hubId` and ignores deliveryAddress, so skip the territory lookup (and
      // its commune requirement) entirely for them.
      const isPickup = order.deliveryType === "stopdesk";
      if (isPickup && !order.stationCode) {
        throw new Error(
          "ZR Express: point de retrait manquant sur la commande. Choisis un bureau ou repasse la livraison en domicile.",
        );
      }

      const idx = isPickup ? null : await loadTerritories(creds);
      let cityId: string | undefined;
      let district: Commune | undefined;

      if (idx) {
        // Resolve wilaya -> city UUID (with spelling aliases).
        let wn = norm(order.wilaya);
        if (WILAYA_ALIAS[wn]) wn = WILAYA_ALIAS[wn];
        cityId = idx.wilayaByName.get(wn);

        if (!cityId) {
          // The site lists some daïras/communes as "wilayas" (Aflou, Barika,
          // Bou Saâda, ...). Fall back to treating it as a commune.
          const asCommune = idx.communeByName.get(wn);
          if (asCommune) {
            cityId = asCommune.parentId;
            district = asCommune;
          }
        }
        if (!cityId) {
          throw new Error(
            `ZR Express: wilaya « ${order.wilaya} » non desservie ou non reconnue. Crée l'expédition manuellement.`,
          );
        }

        if (!district) {
          if (!order.commune || order.commune.trim().length === 0) {
            throw new Error(
              "ZR Express: commune requise. Ouvre la commande et choisis une commune avant de créer l'expédition.",
            );
          }
          district = idx.communesByWilaya.get(cityId)?.get(norm(order.commune));
          if (!district) {
            throw new Error(
              `ZR Express: commune introuvable chez ZR pour ${order.wilaya} « ${order.commune} ». Choisis une autre commune sur la commande.`,
            );
          }
        }
        if (!district.canSend) {
          throw new Error(`ZR Express ne livre pas vers « ${order.commune || order.wilaya} ».`);
        }
      }

      // COD over the 150k cap is sent as amount 0 (treated as prepaid/deposit).
      const amount =
        order.isCod && order.totalAmount <= MAX_AMOUNT ? order.totalAmount : 0;

      const description = (order.productSummary || order.orderNumber).slice(0, 250);
      const payload: Record<string, any> = {
        customer: {
          customerId: uuid(),
          name: order.customerName.slice(0, 100),
          phone: { number1: toIntlPhone(order.phone) },
        },
        ...(isPickup
          ? { hubId: order.stationCode }
          : {
              deliveryAddress: {
                cityTerritoryId: cityId,
                districtTerritoryId: district!.id,
                ...(order.address && order.address.trim()
                  ? { street: order.address.trim().slice(0, 250) }
                  : {}),
              },
            }),
        orderedProducts: [
          {
            productName: description.slice(0, 200) || order.orderNumber,
            unitPrice: order.totalAmount,
            quantity: 1,
            stockType: "none",
          },
        ],
        amount,
        description: description.length >= 2 ? description : `Commande ${order.orderNumber}`,
        deliveryType: isPickup ? "pickup-point" : "home",
        externalId: order.orderNumber.slice(0, 100),
      };

      const created = await call("POST", "/parcels", creds, payload);
      const id: string = created?.id ?? "";
      if (!id) throw new Error(`ZR Express: id de colis absent (${JSON.stringify(created)})`);

      // create returns only the UUID; fetch the human tracking number.
      let tracking = id;
      try {
        const parcel = await call("GET", `/parcels/${id}`, creds);
        if (parcel?.trackingNumber) tracking = parcel.trackingNumber;
      } catch {
        // Parcel exists; tracking lookup failed — fall back to the UUID.
      }
      return { tracking };
    },

    getTrackingUrl(tracking: string) {
      // Public suivi page. Adjust if ZR provides a different customer-facing URL.
      return `https://zr.express/suivi/${tracking}`;
    },
  };
}
