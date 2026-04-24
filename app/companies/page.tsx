import { AppShell } from "@/components/app-shell";
import { CompanyManager } from "@/components/company-manager";
import { getCompanies } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <AppShell active="companies">
      <div className="content-grid">
        <CompanyManager companies={companies} />
      </div>
    </AppShell>
  );
}
