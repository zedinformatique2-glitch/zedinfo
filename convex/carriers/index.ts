import { CarrierAdapter, CarrierCredentials } from "./types";
import { createYalidineAdapter } from "./yalidine";
import { createZrExpressAdapter } from "./zrExpress";
import { createMaystroAdapter } from "./maystro";
import { createEcotrackAdapter } from "./ecotrack";
import { createNoestAdapter } from "./noest";

export function getAdapter(slug: string, credentials: CarrierCredentials): CarrierAdapter | null {
  switch (slug) {
    case "yalidine":
      return createYalidineAdapter(credentials);
    case "zr_express":
      return createZrExpressAdapter(credentials);
    case "maystro":
      return createMaystroAdapter(credentials);
    case "ecotrack":
      return createEcotrackAdapter(credentials);
    case "noest":
      return createNoestAdapter(credentials);
    default:
      return null;
  }
}

export type { CarrierAdapter, CarrierCredentials, ShipmentData, Desk } from "./types";
