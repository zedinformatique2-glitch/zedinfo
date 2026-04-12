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
import type * as categories from "../categories.js";
import type * as configurator from "../configurator.js";
import type * as orders from "../orders.js";
import type * as prebuilts from "../prebuilts.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as seedReal from "../seedReal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  aiChat: typeof aiChat;
  categories: typeof categories;
  configurator: typeof configurator;
  orders: typeof orders;
  prebuilts: typeof prebuilts;
  products: typeof products;
  seed: typeof seed;
  seedReal: typeof seedReal;
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
