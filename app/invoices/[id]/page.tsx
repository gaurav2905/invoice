import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { InvoiceView } from "@/components/invoice-view";
import { isLastInvoiceForCompany } from "@/lib/format";
import { getCompanies, getInvoice, getInvoices } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const company = (await getCompanies()).find((item) => item.id === invoice.companyId);
  if (!company) notFound();

  const invoices = await getInvoices();
  const deletable = isLastInvoiceForCompany(invoice, invoices);

  return (
    <AppShell active="invoices">
      <div className="content-grid">
        <InvoiceView company={company} deletable={deletable} invoice={invoice} />
      </div>
    </AppShell>
  );
}
