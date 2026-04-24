import { NextResponse } from "next/server";

import { createCompany, getCompanies } from "@/lib/store";
import { companySchema } from "@/lib/validators";

export async function GET() {
  return NextResponse.json({ companies: await getCompanies() });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = companySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid company details." }, { status: 400 });
  }
  const company = await createCompany({
    ...parsed.data,
    logoDataUrl: parsed.data.logoDataUrl || undefined
  });
  return NextResponse.json({ company });
}
