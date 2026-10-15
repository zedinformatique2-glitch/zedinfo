/**
 * The public site loads only the Material Symbols it uses (~20 KB instead of
 * the full 450 KB font). A name missing from this list renders as clipped
 * ligature text, so:
 *  - icons written in code: add them to CODE_ICONS (tests/icons.test.ts
 *    fails if one is missing);
 *  - icons coming from data (category icons typed in the admin) go through
 *    safeIcon(), which falls back to "category" for unknown names.
 * The admin layout still loads the full font.
 */

const CODE_ICONS = [
  "add", "add_shopping_cart", "arrow_back", "arrow_downward", "arrow_forward",
  "assignment_return", "balance", "block", "bolt", "bookmark", "bookmark_added",
  "build", "call", "cancel", "chat", "check", "check_circle", "chevron_right",
  "circle", "close", "content_copy", "dashboard", "delete", "desktop_windows",
  "developer_board", "error", "event_available", "expand_less", "expand_more",
  "flash_on", "grid_view", "history", "home", "info", "inventory_2", "lightbulb",
  "link", "link_off", "local_fire_department", "local_shipping", "location_on",
  "lock", "mail", "memory", "memory_alt", "open_in_new", "payments", "person",
  "pin_drop", "power", "progress_activity", "refresh", "remove", "restart_alt",
  "savings", "schedule", "search", "search_off", "send", "settings", "share",
  "shopping_cart", "shopping_cart_checkout", "smart_toy", "speed", "star",
  "storage", "storefront", "support_agent", "swap_horiz", "tune", "upgrade",
  "verified", "verified_user", "warning", "zoom_in",
] as const;

/** Category icons in production (Oct 2026) plus spares for new categories. */
const CATEGORY_ICONS = [
  "ac_unit", "album", "bolt", "cable", "cast", "cast_connected", "category",
  "chair", "chair_alt", "computer", "dashboard", "description", "desk",
  "desktop_windows", "developer_board", "device_hub", "devices", "devices_other",
  "electric_bolt", "extension", "graphic_eq", "grid_view", "hard_drive",
  "headphones", "hub", "ink_pen", "keyboard", "laptop_chromebook", "laptop_mac",
  "memory", "memory_alt", "mic", "monitor", "mouse", "print", "router",
  "settings_input_hdmi", "signal_wifi_4_bar", "speaker", "speed",
  "sports_esports", "storage", "tablet_mac", "usb", "videocam",
  "videogame_asset", "view_in_ar", "wifi",
  // spares
  "apps", "battery_full", "camera", "checkroom", "construction", "dns",
  "electrical_services", "gamepad", "headset", "headset_mic",
  "home_repair_service", "joystick", "keyboard_alt", "laptop", "laptop_windows",
  "phone_android", "photo_camera", "power_settings_new", "scanner", "sd_card",
  "security", "sell", "settings_input_component", "shopping_bag", "smartphone",
  "smart_display", "tablet", "tablet_android", "tv", "watch",
] as const;

export const ICON_NAMES: readonly string[] = [
  ...new Set<string>([...CODE_ICONS, ...CATEGORY_ICONS]),
].sort();

const KNOWN = new Set(ICON_NAMES);

/** For icon names that come from data: unknown names become "category". */
export function safeIcon(name: string | undefined | null): string {
  return name && KNOWN.has(name) ? name : "category";
}

/** Google Fonts stylesheet for just these icons (icon_names must be sorted). */
export const ICON_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0" +
  `&icon_names=${ICON_NAMES.join(",")}&display=swap`;
