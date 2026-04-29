/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as aiChat from "../aiChat.js";
import type * as carriers_ecotrack from "../carriers/ecotrack.js";
import type * as carriers_index from "../carriers/index.js";
import type * as carriers_maystro from "../carriers/maystro.js";
import type * as carriers_noest from "../carriers/noest.js";
import type * as carriers_types from "../carriers/types.js";
import type * as carriers_yalidine from "../carriers/yalidine.js";
import type * as carriers_zrExpress from "../carriers/zrExpress.js";
import type * as categories from "../categories.js";
import type * as configurator from "../configurator.js";
import type * as delivery from "../delivery.js";
import type * as fpsEstimate from "../fpsEstimate.js";
import type * as landingPages from "../landingPages.js";
import type * as migrateImages from "../migrateImages.js";
import type * as normalizeSpecs from "../normalizeSpecs.js";
import type * as orders from "../orders.js";
import type * as prebuilts from "../prebuilts.js";
import type * as products from "../products.js";
import type * as promotionActions from "../promotionActions.js";
import type * as promotions from "../promotions.js";
import type * as seed from "../seed.js";
import type * as seedCategories from "../seedCategories.js";
import type * as seedReal from "../seedReal.js";
import type * as storage from "../storage.js";
import type * as telegram from "../telegram.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  aiChat: typeof aiChat;
  "carriers/ecotrack": typeof carriers_ecotrack;
  "carriers/index": typeof carriers_index;
  "carriers/maystro": typeof carriers_maystro;
  "carriers/noest": typeof carriers_noest;
  "carriers/types": typeof carriers_types;
  "carriers/yalidine": typeof carriers_yalidine;
  "carriers/zrExpress": typeof carriers_zrExpress;
  categories: typeof categories;
  configurator: typeof configurator;
  delivery: typeof delivery;
  fpsEstimate: typeof fpsEstimate;
  landingPages: typeof landingPages;
  migrateImages: typeof migrateImages;
  normalizeSpecs: typeof normalizeSpecs;
  orders: typeof orders;
  prebuilts: typeof prebuilts;
  products: typeof products;
  promotionActions: typeof promotionActions;
  promotions: typeof promotions;
  seed: typeof seed;
  seedCategories: typeof seedCategories;
  seedReal: typeof seedReal;
  storage: typeof storage;
  telegram: typeof telegram;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
