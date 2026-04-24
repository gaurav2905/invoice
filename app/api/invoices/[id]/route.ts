import { NextResponse } from "next/server";

import { deleteInvoice, getInvoice, updateInvoice } from "@/lib/store";
import { invoiceSchema } from "@/lib/validators";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PUT(request: Request, { params }: Props) {
  const { id } = await params;
  const payload = await request.json();
  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice details." }, { status: 400 });
  }

  try {
    const invoice = await updateInvoice(id, parsed.data);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update invoice." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Props) {
  const { id } = await params;
  const result = await deleteInvoice(id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true });
}
