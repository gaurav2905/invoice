"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency, formatDate, isLastInvoiceForCompany, labelForGstMode } from "@/lib/format";
import { Company, Invoice } from "@/lib/types";

type Row = Invoice & {
  company: Company | null;
};

type Props = {
  invoices: Row[];
};

export function DashboardTable({ invoices }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "number">("date");
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = invoices.filter((invoice) => {
      return [invoice.invoiceNumber, invoice.partyName, invoice.company?.name || ""].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "number") return b.sequence - a.sequence;
      return b.invoiceDate.localeCompare(a.invoiceDate);
    });
  }, [invoices, query, sortBy]);

  async function handleDelete(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "Delete failed." }));
        window.alert(result.error || "Delete failed.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="panel stack">
      <div className="section-title">
        <div>
          <span className="eyebrow">Invoice List</span>
          <h2>Manage every invoice</h2>
        </div>
        <div className="row-actions">
          <input
            aria-label="Search invoices"
            placeholder="Search by invoice, party, or company"
            style={{ minWidth: 260 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "number")}>
            <option value="date">Sort by date</option>
            <option value="number">Sort by invoice number</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Company</th>
              <th>Party Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>HST/GST Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No invoices found.</td>
              </tr>
            ) : (
              rows.map((invoice) => {
                const deletable = isLastInvoiceForCompany(invoice, invoices);
                return (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.company?.name || "Unknown company"}</td>
                    <td>{invoice.partyName}</td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{formatCurrency(invoice.totalAmount)}</td>
                    <td>
                      <span className={`pill ${invoice.gstMode === "none" ? "danger" : ""}`}>{labelForGstMode(invoice.gstMode)}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn" href={`/invoices/${invoice.id}`}>
                          View
                        </Link>
                        <Link className="btn" href={`/invoices/${invoice.id}/edit`}>
                          Edit
                        </Link>
                        <button className="btn btn-danger" disabled={!deletable || isPending} onClick={() => handleDelete(invoice.id)}>
                          {deletable ? "Delete" : "Locked"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
