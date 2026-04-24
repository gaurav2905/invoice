"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency, formatDate, labelForGstMode } from "@/lib/format";
import { Company, Invoice } from "@/lib/types";

type Props = {
  company: Company;
  invoice: Invoice;
  deletable: boolean;
};

export function InvoiceView({ company, invoice, deletable }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handlePdf() {
    if (!invoiceRef.current) return;
    setBusy(true);
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: "#fffdf9" });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imageData, "PNG", 0, 0, width, Math.min(height, pdf.internal.pageSize.getHeight()));
    pdf.save(`${invoice.invoiceNumber.replaceAll("/", "-")}.pdf`);
    setBusy(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this invoice? This is only allowed for the most recent invoice for the selected company.");
    if (!confirmed) return;

    const response = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(result.error || "Unable to delete invoice.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const waitingSubtotal = Number((invoice.shipperWaitingAmount + invoice.receiverWaitingAmount).toFixed(2));

  return (
    <div className="stack">
      <section className="panel no-print">
        <div className="section-title">
          <div>
            <span className="eyebrow">Invoice Actions</span>
            <h2>{invoice.invoiceNumber}</h2>
          </div>
          <span className={`pill ${invoice.gstMode === "none" ? "danger" : ""}`}>{labelForGstMode(invoice.gstMode)}</span>
        </div>
        <div className="row-actions">
          <button className="btn btn-primary" onClick={() => window.print()} type="button">
            Print
          </button>
          <button className="btn" disabled={busy} onClick={handlePdf} type="button">
            {busy ? "Preparing PDF..." : "Download PDF"}
          </button>
          <Link className="btn" href={`/invoices/${invoice.id}/edit`}>
            Edit
          </Link>
          <button className="btn btn-danger" disabled={!deletable} onClick={handleDelete} type="button">
            {deletable ? "Delete" : "Delete Locked"}
          </button>
        </div>
      </section>

      <div className="invoice-paper" ref={invoiceRef}>
        <div className="invoice-header">
          <div>
            <span className="eyebrow">Issued By</span>
            <h1 style={{ marginBottom: 10 }}>{company.name}</h1>
            <div className="invoice-block">
              <div>{company.address}</div>
              {company.gstin ? <div>HST/GST Number: {company.gstin}</div> : null}
              {company.pan ? <div>PAN: {company.pan}</div> : null}
            </div>
          </div>
          <div className="invoice-meta">
            {company.logoDataUrl ? <Image alt={`${company.name} logo`} className="logo-preview" height={84} src={company.logoDataUrl} width={84} /> : null}
            <div className="invoice-block" style={{ width: "100%" }}>
              <div className="eyebrow">Invoice Number</div>
              <h2 style={{ margin: "4px 0 0" }}>{invoice.invoiceNumber}</h2>
            </div>
            <div className="invoice-block" style={{ width: "100%" }}>
              <div className="eyebrow">Invoice Date</div>
              <strong>{formatDate(invoice.invoiceDate)}</strong>
            </div>
            {invoice.loadNumber ? (
              <div className="invoice-block" style={{ width: "100%" }}>
                <div className="eyebrow">Load #</div>
                <strong>{invoice.loadNumber}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <div className="invoice-section" style={{ marginTop: 20 }}>
          <div className="invoice-two-col">
            <div className="invoice-block">
              <div className="eyebrow">Bill To</div>
              <strong>{invoice.partyName}</strong>
              <div>{invoice.partyAddress}</div>
              {invoice.partyContactNumber ? <div>Contact Number: {invoice.partyContactNumber}</div> : null}
              {invoice.partyGstin ? <div>HST/GST Number: {invoice.partyGstin}</div> : null}
              {invoice.partyPan ? <div>PAN: {invoice.partyPan}</div> : null}
            </div>
            {invoice.gstMode !== "none" ? (
              <div className="invoice-block">
                <div className="eyebrow">Tax Mode</div>
                <strong>{labelForGstMode(invoice.gstMode)}</strong>
                <div>HST/GST Rate: {invoice.gstRate}%</div>
                <div>Total in words</div>
                <strong>{invoice.totalAmountWords}</strong>
              </div>
            ) : (
              <div className="invoice-block">
                <div className="eyebrow">Total in words</div>
                <strong>{invoice.totalAmountWords}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="invoice-section" style={{ marginTop: 20 }}>
          {invoice.loadNumber ? <div className="invoice-load-heading">Load# {invoice.loadNumber}</div> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Shipper</th>
                  <th>Pickup Date</th>
                  <th>Consignee</th>
                  <th>Delivery Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.shipper || "-"}</div>
                      {item.description ? <div className="muted">Description: {item.description}</div> : null}
                    </td>
                    <td>{item.pickupDate ? formatDate(item.pickupDate) : "-"}</td>
                    <td>{item.consignee || "-"}</td>
                    <td>{item.deliveryDate ? formatDate(item.deliveryDate) : "-"}</td>
                    <td>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="invoice-section" style={{ marginTop: 20 }}>
          <div className="invoice-block stack" style={{ gap: 10 }}>
            <div className="eyebrow">Additional Charges</div>
            <div className="charges-row">
              <span>Waiting time at shipper {invoice.waitingTimeAtShipper ? `(${invoice.waitingTimeAtShipper})` : ""}</span>
              <strong>{formatCurrency(invoice.shipperWaitingAmount)}</strong>
            </div>
            <div className="charges-row">
              <span>Waiting time at receiver {invoice.waitingTimeAtReceiver ? `(${invoice.waitingTimeAtReceiver})` : ""}</span>
              <strong>{formatCurrency(invoice.receiverWaitingAmount)}</strong>
            </div>
            <div className="charges-row">
              <span>Other Charges</span>
              <strong>{formatCurrency(invoice.otherCharges)}</strong>
            </div>
          </div>
        </div>

        {invoice.remarks ? (
          <div className="invoice-section" style={{ marginTop: 20 }}>
            <div className="invoice-block">
              <div className="eyebrow">Remarks</div>
              <div>{invoice.remarks}</div>
            </div>
          </div>
        ) : null}

        <div className="invoice-totals" style={{ marginTop: 24 }}>
          <div className="invoice-total-row">
            <span>Items Subtotal</span>
            <strong>{formatCurrency(invoice.itemsSubtotal)}</strong>
          </div>
          <div className="invoice-total-row">
            <span>Waiting Charges</span>
            <strong>{formatCurrency(waitingSubtotal)}</strong>
          </div>
          <div className="invoice-total-row">
            <span>Other Charges</span>
            <strong>{formatCurrency(invoice.otherCharges)}</strong>
          </div>
          <div className="invoice-total-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(invoice.taxableAmount)}</strong>
          </div>
          {invoice.gstMode !== "none" ? (
            <div className="invoice-total-row">
              <span>Total HST/GST</span>
              <strong>{formatCurrency(invoice.totalTax)}</strong>
            </div>
          ) : null}
          <div className="invoice-total-row grand">
            <span>Grand Total</span>
            <strong>{formatCurrency(invoice.totalAmount)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
