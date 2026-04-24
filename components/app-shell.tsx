import Link from "next/link";
import { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";

type Props = {
  children: ReactNode;
  active?: "dashboard" | "companies" | "invoices";
};

export function AppShell({ children, active = "dashboard" }: Props) {
  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="topbar">
          <div className="brand">
            <span className="eyebrow">Invoice Generator & Manager</span>
            <h1>Billing Control Room</h1>
          </div>
          <nav className="nav-links">
            <Link className={`nav-link ${active === "dashboard" ? "active" : ""}`} href="/">
              Dashboard
            </Link>
            <Link className={`nav-link ${active === "companies" ? "active" : ""}`} href="/companies">
              Companies
            </Link>
            <Link className={`nav-link ${active === "invoices" ? "active" : ""}`} href="/invoices/new">
              New Invoice
            </Link>
            <LogoutButton />
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
