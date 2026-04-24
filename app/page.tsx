import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DashboardTable } from "@/components/dashboard-table";
import { formatCurrency } from "@/lib/format";
import { getDashboardData, getStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getStats();
  const invoices = await getDashboardData();

  return (
    <AppShell active="dashboard">
      <div className="content-grid">
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Admin Dashboard</span>
              <h2>Track companies, invoices, and totals in one place</h2>
            </div>
            <Link className="btn btn-primary" href="/invoices/new">
              Create New Invoice
            </Link>
          </div>
          <div className="stats-row">
            <article className="stat-card">
              <span className="eyebrow">Companies</span>
              <strong>{stats.companyCount}</strong>
              <span className="muted">Registered issuing entities</span>
            </article>
            <article className="stat-card">
              <span className="eyebrow">Invoices</span>
              <strong>{stats.invoiceCount}</strong>
              <span className="muted">Created and securely stored</span>
            </article>
            <article className="stat-card">
              <span className="eyebrow">Revenue</span>
              <strong>{formatCurrency(stats.totalRevenue)}</strong>
              <span className="muted">Aggregate billed amount</span>
            </article>
            <article className="stat-card">
              <span className="eyebrow">With HST/GST</span>
              <strong>{stats.withGst}</strong>
              <span className="muted">Invoices containing tax breakup</span>
            </article>
          </div>
        </section>

        <DashboardTable invoices={invoices} />
      </div>
      <Link aria-label="Create invoice" className="floating-action" href="/invoices/new">
        +
      </Link>
    </AppShell>
  );
}
