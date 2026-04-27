import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { InvoiceForm } from "@/components/invoice-form";
import { getCompanies, getSavedInvoiceContacts, getSavedParties } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const companies = await getCompanies();
  const savedParties = await getSavedParties();
  const savedInvoiceContacts = await getSavedInvoiceContacts();

  return (
    <AppShell active="invoices">
      <div className="content-grid">
        {companies.length === 0 ? (
          <section className="panel stack">
            <div className="section-title">
              <div>
                <span className="eyebrow">Setup Needed</span>
                <h2>Add your first company before creating invoices</h2>
              </div>
            </div>
            <p className="muted">Company records store HST/GST number, PAN, address, and optional branding for invoice output.</p>
            <Link className="btn btn-primary" href="/companies">
              Go to Company Management
            </Link>
          </section>
        ) : (
          <InvoiceForm companies={companies} savedInvoiceContacts={savedInvoiceContacts} savedParties={savedParties} />
        )}
      </div>
    </AppShell>
  );
}
