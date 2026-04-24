export type GstMode = "none" | "intra" | "inter";

export type InvoiceLineItem = {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  amount: number;
  shipper: string;
  pickupDate: string;
  consignee: string;
  deliveryDate: string;
};

export type Company = {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  address: string;
  logoDataUrl?: string;
  invoiceCounter: number;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  companyId: string;
  invoiceNumber: string;
  sequence: number;
  loadNumber: string;
  partyName: string;
  partyContactNumber: string;
  partyGstin: string;
  partyPan: string;
  partyAddress: string;
  invoiceDate: string;
  lineItems: InvoiceLineItem[];
  itemsSubtotal: number;
  waitingTimeAtShipper: string;
  shipperWaitingAmount: number;
  waitingTimeAtReceiver: string;
  receiverWaitingAmount: number;
  otherCharges: number;
  remarks: string;
  taxableAmount: number;
  gstRate: number;
  gstMode: GstMode;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  totalAmountWords: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  companies: Company[];
  invoices: Invoice[];
};

export type SavedParty = {
  name: string;
  contactNumber: string;
  gstin: string;
  pan: string;
  address: string;
};
