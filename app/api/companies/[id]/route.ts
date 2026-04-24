import { NextResponse } from "next/server";

import { updateCompany } from "@/lib/store";
import { companySchema } from "@/lib/validators";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Props) {
  const { id } = await params;
  const payload = await request.json();
  const parsed = companySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid company details." }, { status: 400 });
  }

  const company = await updateCompany(id, {
    ...parsed.data,
    logoDataUrl: parsed.data.logoDataUrl || undefined
  });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({ company });
}
