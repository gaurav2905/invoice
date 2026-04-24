import { NextResponse } from "next/server";

import { createInvoice, getDashboardData } from "@/lib/store";
import { invoiceSchema } from "@/lib/validators";

export async function GET() {
  return NextResponse.json({ invoices: await getDashboardData() });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice details." }, { status: 400 });
  }

  try {
    const invoice = await createInvoice(parsed.data);
    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create invoice." },
      { status: 400 }
    );
  }
}
