import { GstMode, Invoice, InvoiceLineItem } from "@/lib/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function labelForGstMode(mode: GstMode) {
  if (mode === "intra") return "With HST/GST (CGST + SGST)";
  if (mode === "inter") return "With HST/GST (IGST)";
  return "Without HST/GST";
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];

const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(num: number): string {
  const hundred = Math.floor(num / 100);
  const rem = num % 100;
  const hundredPart = hundred ? `${ones[hundred]} Hundred` : "";
  const remPart =
    rem < 20 ? ones[rem] : `${tens[Math.floor(rem / 10)]}${rem % 10 ? ` ${ones[rem % 10]}` : ""}`;
  return [hundredPart, remPart].filter(Boolean).join(" ").trim();
}

export function numberToWords(amount: number) {
  if (amount === 0) return "Zero Dollars Only";

  const [dollarsPart, centsPart] = amount.toFixed(2).split(".");
  let num = Number(dollarsPart);
  const parts: string[] = [];
  const units: [number, string][] = [
    [1000000000, "Billion"],
    [1000000, "Million"],
    [1000, "Thousand"],
    [1, ""]
  ];

  for (const [value, label] of units) {
    if (num >= value) {
      const chunk = Math.floor(num / value);
      num %= value;
      if (chunk) parts.push(`${belowThousand(chunk)}${label ? ` ${label}` : ""}`.trim());
    }
  }

  const cents = Number(centsPart);
  const suffix = cents ? ` and ${belowThousand(cents)} Cents` : "";
  return `${parts.join(" ")} Dollars${suffix} Only`;
}

export function computeInvoiceTotals(taxableAmount: number, gstRate: number, gstMode: GstMode) {
  const safeTaxable = Number.isFinite(taxableAmount) ? taxableAmount : 0;
  const safeRate = Number.isFinite(gstRate) ? gstRate : 0;
  if (gstMode === "none") {
    return {
      taxableAmount: safeTaxable,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalAmount: safeTaxable,
      totalAmountWords: numberToWords(safeTaxable)
    };
  }

  if (gstMode === "intra") {
    const tax = (safeTaxable * safeRate) / 100;
    const half = Number((tax / 2).toFixed(2));
    const totalTax = Number((half * 2).toFixed(2));
    const totalAmount = Number((safeTaxable + totalTax).toFixed(2));
    return {
      taxableAmount: safeTaxable,
      cgst: half,
      sgst: half,
      igst: 0,
      totalTax,
      totalAmount,
      totalAmountWords: numberToWords(totalAmount)
    };
  }

  const igst = Number(((safeTaxable * safeRate) / 100).toFixed(2));
  const totalAmount = Number((safeTaxable + igst).toFixed(2));
  return {
    taxableAmount: safeTaxable,
    cgst: 0,
    sgst: 0,
    igst,
    totalTax: igst,
    totalAmount,
    totalAmountWords: numberToWords(totalAmount)
  };
}

export function getLineItemAmount(quantity: number, rate: number) {
  return Number((quantity * rate).toFixed(2));
}

export function summarizeLineItems(lineItems: InvoiceLineItem[]) {
  return Number(
    lineItems.reduce((sum, item) => sum + getLineItemAmount(Number(item.quantity), Number(item.rate)), 0).toFixed(2)
  );
}

export function isLastInvoiceForCompany(invoice: Invoice, invoices: Invoice[]) {
  const companyInvoices = invoices
    .filter((item) => item.companyId === invoice.companyId)
    .sort((a, b) => b.sequence - a.sequence || b.createdAt.localeCompare(a.createdAt));
  return companyInvoices[0]?.id === invoice.id;
}
