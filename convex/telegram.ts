import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDzd(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " DZD";
}

export const notifyNewOrder = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.warn("Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing)");
      return;
    }

    const order = await ctx.runQuery(internal.telegram._getOrder, { orderId });
    if (!order) return;

    const itemsText = order.items
      .map(
        (i: any) =>
          `• ${escapeHtml(i.nameFr)} ×${i.qty} — ${fmtDzd(i.priceDzd * i.qty)}`
      )
      .join("\n");

    const c = order.customer;
    const lines = [
      `🆕 <b>Nouvelle commande</b> <code>${escapeHtml(order.orderNumber)}</code>`,
      ``,
      `<b>Client:</b> ${escapeHtml(c.fullName)}`,
      `<b>Tél:</b> <a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a>`,
      c.email ? `<b>Email:</b> ${escapeHtml(c.email)}` : null,
      `<b>Wilaya:</b> ${escapeHtml(c.wilaya)}${c.commune ? " — " + escapeHtml(c.commune) : ""}`,
      `<b>Adresse:</b> ${escapeHtml(c.address)}`,
      order.deliveryType
        ? `<b>Livraison:</b> ${order.deliveryType === "stopdesk" ? "Stop-desk" : "Domicile"}${order.stationCode ? " (" + escapeHtml(order.stationCode) + ")" : ""}`
        : null,
      c.notes ? `<b>Notes:</b> ${escapeHtml(c.notes)}` : null,
      ``,
      `<b>Articles:</b>`,
      itemsText,
      ``,
      `Sous-total: ${fmtDzd(order.subtotalDzd)}`,
      `Livraison: ${fmtDzd(order.shippingDzd)}`,
      `<b>Total: ${fmtDzd(order.totalDzd)}</b>`,
      `Paiement: ${order.paymentMethod === "cod" ? "À la livraison" : "WhatsApp"}`,
    ].filter(Boolean);

    const text = lines.join("\n");

    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("Telegram sendMessage failed", resp.status, body);
    }
  },
});

import { internalQuery } from "./_generated/server";

export const _getOrder = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    return await ctx.db.get(orderId);
  },
});
