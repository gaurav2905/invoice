import { computeInvoiceTotals } from "@/lib/format";
import { Company, GstMode, Invoice, InvoiceLineItem, SavedParty } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const INVOICE_SEQUENCE_START = 111;

type CompanyRow = {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  address: string;
  logo_data_url: string | null;
  invoice_counter: number;
  created_at: string;
  updated_at: string;
};

type InvoiceRow = {
  id: string;
  company_id: string;
  invoice_number: string;
  sequence: number;
  load_number: string | null;
  party_name: string;
  party_contact_number: string | null;
  party_gstin: string | null;
  party_pan: string | null;
  party_address: string;
  invoice_date: string;
  line_items: InvoiceLineItem[] | null;
  items_subtotal: number;
  waiting_time_at_shipper: string | null;
  shipper_waiting_amount: number;
  waiting_time_at_receiver: string | null;
  receiver_waiting_amount: number;
  other_charges: number;
  remarks: string | null;
  taxable_amount: number;
  gst_rate: number;
  gst_mode: GstMode;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
  total_amount_words: string;
  created_at: string;
  updated_at: string;
};

type DashboardInvoiceRow = InvoiceRow & {
  companies: CompanyRow | null;
};

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function getInvoiceNumber(sequence: number) {
  return String(INVOICE_SEQUENCE_START + sequence).padStart(5, "0");
}

export type CompanyInput = {
  name: string;
  gstin?: string;
  pan?: string;
  address: string;
  logoDataUrl?: string;
};

export type InvoiceInput = {
  companyId: string;
  loadNumber?: string;
  partyName: string;
  partyContactNumber?: string;
  partyGstin?: string;
  partyPan?: string;
  partyAddress: string;
  invoiceDate: string;
  lineItems: Array<{
    description: string;
    hsnSac?: string;
    quantity: number;
    rate: number;
    shipper?: string;
    pickupDate?: string;
    consignee?: string;
    deliveryDate?: string;
  }>;
  waitingTimeAtShipper?: string;
  shipperWaitingAmount?: number;
  waitingTimeAtReceiver?: string;
  receiverWaitingAmount?: number;
  otherCharges?: number;
  remarks?: string;
  gstRate: number;
  gstMode: GstMode;
};

function normalizeLineItems(items: InvoiceInput["lineItems"]): InvoiceLineItem[] {
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const rate = Number(item.rate);
    const amount = Number((quantity * rate).toFixed(2));
    return {
      id: makeId("line"),
      description: item.description,
      hsnSac: item.hsnSac || "",
      quantity,
      rate,
      amount,
      shipper: item.shipper || "",
      pickupDate: item.pickupDate || "",
      consignee: item.consignee || "",
      deliveryDate: item.deliveryDate || ""
    };
  });
}

function getTaxableAmount(lineItems: InvoiceLineItem[], shipperWaitingAmount = 0, receiverWaitingAmount = 0, otherCharges = 0) {
  const itemsSubtotal = Number(lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const taxableAmount = Number((itemsSubtotal + shipperWaitingAmount + receiverWaitingAmount + otherCharges).toFixed(2));
  return { itemsSubtotal, taxableAmount };
}

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    gstin: row.gstin,
    pan: row.pan,
    address: row.address,
    logoDataUrl: row.logo_data_url || undefined,
    invoiceCounter: row.invoice_counter,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    companyId: row.company_id,
    invoiceNumber: getInvoiceNumber(row.sequence),
    sequence: row.sequence,
    loadNumber: row.load_number || "",
    partyName: row.party_name,
    partyContactNumber: row.party_contact_number || "",
    partyGstin: row.party_gstin || "",
    partyPan: row.party_pan || "",
    partyAddress: row.party_address,
    invoiceDate: row.invoice_date,
    lineItems: (row.line_items || []).map((item) => ({
      ...item,
      shipper: item.shipper || "",
      pickupDate: item.pickupDate || "",
      consignee: item.consignee || "",
      deliveryDate: item.deliveryDate || ""
    })),
    itemsSubtotal: Number(row.items_subtotal || 0),
    waitingTimeAtShipper: row.waiting_time_at_shipper || "",
    shipperWaitingAmount: Number(row.shipper_waiting_amount || 0),
    waitingTimeAtReceiver: row.waiting_time_at_receiver || "",
    receiverWaitingAmount: Number(row.receiver_waiting_amount || 0),
    otherCharges: Number(row.other_charges || 0),
    remarks: row.remarks || "",
    taxableAmount: Number(row.taxable_amount || 0),
    gstRate: Number(row.gst_rate || 0),
    gstMode: row.gst_mode,
    cgst: Number(row.cgst || 0),
    sgst: Number(row.sgst || 0),
    igst: Number(row.igst || 0),
    totalTax: Number(row.total_tax || 0),
    totalAmount: Number(row.total_amount || 0),
    totalAmountWords: row.total_amount_words,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requireCompanyRow(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle<CompanyRow>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Company not found.");
  return data;
}

export async function getCompanies() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("*").order("name", { ascending: true }).returns<CompanyRow[]>();
  if (error) throw new Error(error.message);
  return (data || []).map(mapCompany);
}

export async function getCompany(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle<CompanyRow>();
  if (error) throw new Error(error.message);
  return data ? mapCompany(data) : null;
}

export async function createCompany(input: CompanyInput) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const row = {
    id: makeId("company"),
    name: input.name,
    gstin: input.gstin || "",
    pan: input.pan || "",
    address: input.address,
    logo_data_url: input.logoDataUrl || null,
    invoice_counter: 0,
    created_at: now,
    updated_at: now
  };
  const { data, error } = await supabase.from("companies").insert(row).select().single<CompanyRow>();
  if (error) throw new Error(error.message);
  return mapCompany(data);
}

export async function updateCompany(id: string, input: CompanyInput) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .update({
      name: input.name,
      gstin: input.gstin || "",
      pan: input.pan || "",
      address: input.address,
      logo_data_url: input.logoDataUrl || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle<CompanyRow>();
  if (error) throw new Error(error.message);
  return data ? mapCompany(data) : null;
}

export async function getInvoices() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<InvoiceRow[]>();
  if (error) throw new Error(error.message);
  return (data || []).map(mapInvoice);
}

export async function getInvoice(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle<InvoiceRow>();
  if (error) throw new Error(error.message);
  return data ? mapInvoice(data) : null;
}

export async function createInvoice(input: InvoiceInput) {
  const supabase = getSupabaseAdmin();
  const company = await requireCompanyRow(input.companyId);
  const nextSequence = Number(company.invoice_counter || 0) + 1;

  const updateCompanyResult = await supabase
    .from("companies")
    .update({ invoice_counter: nextSequence, updated_at: new Date().toISOString() })
    .eq("id", input.companyId)
    .eq("invoice_counter", company.invoice_counter)
    .select("id, invoice_counter")
    .maybeSingle<{ id: string; invoice_counter: number }>();

  if (updateCompanyResult.error) throw new Error(updateCompanyResult.error.message);
  if (!updateCompanyResult.data) {
    throw new Error("Invoice counter changed during save. Please try again.");
  }

  const now = new Date().toISOString();
  const lineItems = normalizeLineItems(input.lineItems);
  const shipperWaitingAmount = Number(input.shipperWaitingAmount || 0);
  const receiverWaitingAmount = Number(input.receiverWaitingAmount || 0);
  const otherCharges = Number(input.otherCharges || 0);
  const { itemsSubtotal, taxableAmount } = getTaxableAmount(lineItems, shipperWaitingAmount, receiverWaitingAmount, otherCharges);
  const totals = computeInvoiceTotals(taxableAmount, input.gstRate, input.gstMode);

  const row = {
    id: makeId("invoice"),
    company_id: input.companyId,
    invoice_number: getInvoiceNumber(nextSequence),
    sequence: nextSequence,
    load_number: input.loadNumber || null,
    party_name: input.partyName,
    party_contact_number: input.partyContactNumber || null,
    party_gstin: input.partyGstin || null,
    party_pan: input.partyPan || null,
    party_address: input.partyAddress,
    invoice_date: input.invoiceDate,
    line_items: lineItems,
    items_subtotal: itemsSubtotal,
    waiting_time_at_shipper: input.waitingTimeAtShipper || null,
    shipper_waiting_amount: shipperWaitingAmount,
    waiting_time_at_receiver: input.waitingTimeAtReceiver || null,
    receiver_waiting_amount: receiverWaitingAmount,
    other_charges: otherCharges,
    remarks: input.remarks || null,
    gst_rate: input.gstRate,
    gst_mode: input.gstMode,
    taxable_amount: totals.taxableAmount,
    cgst: totals.cgst,
    sgst: totals.sgst,
    igst: totals.igst,
    total_tax: totals.totalTax,
    total_amount: totals.totalAmount,
    total_amount_words: totals.totalAmountWords,
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase.from("invoices").insert(row).select().single<InvoiceRow>();
  if (error) throw new Error(error.message);
  return mapInvoice(data);
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  const supabase = getSupabaseAdmin();
  const existing = await getInvoice(id);
  if (!existing) return null;
  await requireCompanyRow(input.companyId);

  const lineItems = normalizeLineItems(input.lineItems);
  const shipperWaitingAmount = Number(input.shipperWaitingAmount || 0);
  const receiverWaitingAmount = Number(input.receiverWaitingAmount || 0);
  const otherCharges = Number(input.otherCharges || 0);
  const { itemsSubtotal, taxableAmount } = getTaxableAmount(lineItems, shipperWaitingAmount, receiverWaitingAmount, otherCharges);
  const totals = computeInvoiceTotals(taxableAmount, input.gstRate, input.gstMode);

  const { data, error } = await supabase
    .from("invoices")
    .update({
      company_id: input.companyId,
      invoice_number: getInvoiceNumber(existing.sequence),
      load_number: input.loadNumber || null,
      party_name: input.partyName,
      party_contact_number: input.partyContactNumber || null,
      party_gstin: input.partyGstin || null,
      party_pan: input.partyPan || null,
      party_address: input.partyAddress,
      invoice_date: input.invoiceDate,
      line_items: lineItems,
      items_subtotal: itemsSubtotal,
      waiting_time_at_shipper: input.waitingTimeAtShipper || null,
      shipper_waiting_amount: shipperWaitingAmount,
      waiting_time_at_receiver: input.waitingTimeAtReceiver || null,
      receiver_waiting_amount: receiverWaitingAmount,
      other_charges: otherCharges,
      remarks: input.remarks || null,
      gst_rate: input.gstRate,
      gst_mode: input.gstMode,
      taxable_amount: totals.taxableAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      total_tax: totals.totalTax,
      total_amount: totals.totalAmount,
      total_amount_words: totals.totalAmountWords,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle<InvoiceRow>();
  if (error) throw new Error(error.message);
  return data ? mapInvoice(data) : null;
}

export async function deleteInvoice(id: string) {
  const supabase = getSupabaseAdmin();
  const invoice = await getInvoice(id);
  if (!invoice) return { ok: false, reason: "Invoice not found." };

  const companyInvoices = await getInvoices();
  const latestForCompany = companyInvoices
    .filter((item) => item.companyId === invoice.companyId)
    .sort((a, b) => b.sequence - a.sequence || b.createdAt.localeCompare(a.createdAt))[0];

  if (latestForCompany?.id !== invoice.id) {
    return { ok: false, reason: "Only the most recently created invoice for a company can be deleted." };
  }

  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const company = await getCompany(invoice.companyId);
  if (company && company.invoiceCounter === invoice.sequence) {
    const companyUpdate = await supabase
      .from("companies")
      .update({ invoice_counter: company.invoiceCounter - 1, updated_at: new Date().toISOString() })
      .eq("id", company.id);
    if (companyUpdate.error) throw new Error(companyUpdate.error.message);
  }

  return { ok: true };
}

export async function getDashboardData() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, companies(*)")
    .order("created_at", { ascending: false })
    .returns<DashboardInvoiceRow[]>();
  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    ...mapInvoice(row),
    company: row.companies ? mapCompany(row.companies) : null
  }));
}

export async function getStats() {
  const invoices = await getInvoices();
  const companies = await getCompanies();
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const withGst = invoices.filter((invoice) => invoice.gstMode !== "none").length;
  return {
    companyCount: companies.length,
    invoiceCount: invoices.length,
    totalRevenue,
    withGst
  };
}

export async function getSavedParties(): Promise<SavedParty[]> {
  const invoices = await getInvoices();
  const latestByName = new Map<string, SavedParty>();

  for (const invoice of invoices.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const key = invoice.partyName.trim().toLowerCase();
    if (!key || latestByName.has(key)) continue;
    latestByName.set(key, {
      name: invoice.partyName,
      contactNumber: invoice.partyContactNumber || "",
      gstin: invoice.partyGstin || "",
      pan: invoice.partyPan || "",
      address: invoice.partyAddress || ""
    });
  }

  return Array.from(latestByName.values()).sort((a, b) => a.name.localeCompare(b.name));
}
