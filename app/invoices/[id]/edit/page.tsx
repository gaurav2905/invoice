import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { InvoiceForm } from "@/components/invoice-form";
import { getCompanies, getInvoice, getSavedParties } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const companies = await getCompanies();
  const savedParties = await getSavedParties();

  return (
    <AppShell active="invoices">
      <div className="content-grid">
        <InvoiceForm companies={companies} invoice={invoice} savedParties={savedParties} />
      </div>
    </AppShell>
  );
}
