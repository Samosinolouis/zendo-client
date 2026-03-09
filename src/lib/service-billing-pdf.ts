import type { InvoiceData } from "@/types";

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function openServiceBillingPdf(payload: InvoiceData): void {
  if (globalThis.window === undefined) return;

  const rows = payload.items
    .map(
      (item) => `
        <tr>
          <td>${esc(item.description)}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${money(item.unitPrice)}</td>
          <td style="text-align:right">${money(item.amount)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${esc(payload.invoiceNumber)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6b7280; padding-bottom: 12px; }
          .title { font-size: 28px; font-weight: 700; letter-spacing: 1px; }
          .muted { color: #6b7280; font-size: 12px; }
          .section { margin-top: 16px; }
          .box { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; }
          .totals { width: 320px; margin-left: auto; margin-top: 14px; }
          .totals div { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
          .totals .grand { font-weight: 700; border-top: 1px solid #9ca3af; padding-top: 8px; }
          @media print {
            body { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size:16px;font-weight:700">${esc(payload.sellerRegisteredName)}</div>
            <div class="muted">${esc(payload.sellerAddress)}</div>
            <div class="muted">TIN: ${esc(payload.sellerTIN)}${payload.sellerBranchCode ? ` | Branch: ${esc(payload.sellerBranchCode)}` : ""}</div>
          </div>
          <div style="text-align:right">
            <div class="title">INVOICE</div>
            <div class="muted">No: ${esc(payload.invoiceNumber)}</div>
            <div class="muted">Serial: ${esc(payload.serialNumber)}</div>
            <div class="muted">Date: ${esc(payload.invoiceDate)}</div>
          </div>
        </div>

        <div class="section box">
          <div style="font-size:12px;font-weight:700; margin-bottom:6px;">Bill To</div>
          <div style="font-size:13px">${esc(payload.buyerName ?? "Walk-in Customer")}</div>
          <div class="muted">${esc(payload.buyerAddress ?? "-")}</div>
          <div class="muted">TIN: ${esc(payload.buyerTIN ?? "-")}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Unit Price</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Subtotal</span><span>${money(payload.subtotal)}</span></div>
          ${payload.discount && payload.discount > 0 ? `<div><span>${esc(payload.discountDescription ?? "Discount")}</span><span>- ${money(payload.discount)}</span></div>` : ""}
          <div class="grand"><span>Total</span><span>${money(payload.total)}</span></div>
        </div>

        <div class="section muted" style="text-align:center; margin-top:28px;">
          THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX
        </div>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = globalThis.window.open(url, "_blank", "noopener,noreferrer");
  if (!win) return;
  globalThis.window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
