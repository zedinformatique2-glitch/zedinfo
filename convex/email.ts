import { internalAction, internalQuery } from "./_generated/server";
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
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ADMIN_EMAIL ?? "zedinformatique2@gmail.com";
    const from = process.env.RESEND_FROM ?? "Zed Informatique <onboarding@resend.dev>";
    if (!apiKey) {
      console.warn("Resend not configured (RESEND_API_KEY missing)");
      return;
    }

    const order = await ctx.runQuery(internal.email._getOrder, { orderId });
    if (!order) return;

    const c = order.customer;
    const itemsRows = order.items
      .map(
        (i: any) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(
            i.nameFr
          )}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${fmtDzd(
            i.priceDzd * i.qty
          )}</td></tr>`
      )
      .join("");

    const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#111">
  <h2 style="color:#0035d0;margin:0 0 8px">Nouvelle commande ${escapeHtml(order.orderNumber)}</h2>
  <p style="margin:0 0 16px;color:#555">Reçue le ${new Date(order.createdAt).toLocaleString("fr-FR")}</p>

  <h3 style="margin:16px 0 4px">Client</h3>
  <p style="margin:0;line-height:1.6">
    <strong>${escapeHtml(c.fullName)}</strong><br/>
    Tél: <a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a><br/>
    ${c.email ? `Email: ${escapeHtml(c.email)}<br/>` : ""}
    Wilaya: ${escapeHtml(c.wilaya)}${c.commune ? " — " + escapeHtml(c.commune) : ""}<br/>
    Adresse: ${escapeHtml(c.address)}<br/>
    ${order.deliveryType ? `Livraison: ${order.deliveryType === "stopdesk" ? "Stop-desk" : "Domicile"}${order.stationCode ? " (" + escapeHtml(order.stationCode) + ")" : ""}<br/>` : ""}
    ${c.notes ? `Notes: ${escapeHtml(c.notes)}<br/>` : ""}
  </p>

  <h3 style="margin:20px 0 4px">Articles</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="background:#f5f5f5"><th style="padding:6px 10px;text-align:left">Produit</th><th style="padding:6px 10px">Qté</th><th style="padding:6px 10px;text-align:right">Total</th></tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <table style="margin-top:12px;margin-left:auto;font-size:14px">
    <tr><td style="padding:2px 10px">Sous-total</td><td style="padding:2px 10px;text-align:right">${fmtDzd(order.subtotalDzd)}</td></tr>
    <tr><td style="padding:2px 10px">Livraison</td><td style="padding:2px 10px;text-align:right">${fmtDzd(order.shippingDzd)}</td></tr>
    <tr><td style="padding:4px 10px;font-weight:700;border-top:1px solid #ddd">Total</td><td style="padding:4px 10px;text-align:right;font-weight:700;border-top:1px solid #ddd">${fmtDzd(order.totalDzd)}</td></tr>
  </table>

  <p style="margin:16px 0 0;color:#555;font-size:13px">Paiement: ${order.paymentMethod === "cod" ? "À la livraison" : "WhatsApp"}</p>
</div>`;

    const text = `Nouvelle commande ${order.orderNumber}\n\nClient: ${c.fullName}\nTél: ${c.phone}\nWilaya: ${c.wilaya}\nAdresse: ${c.address}\n\nTotal: ${fmtDzd(order.totalDzd)}`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nouvelle commande ${order.orderNumber} — ${fmtDzd(order.totalDzd)}`,
        html,
        text,
        reply_to: c.email || undefined,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("Resend send failed", resp.status, body);
    }
  },
});

export const _getOrder = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    return await ctx.db.get(orderId);
  },
});
