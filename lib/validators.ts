import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2),
  gstin: z.string().trim().optional().or(z.literal("")),
  pan: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(5),
  logoDataUrl: z.string().trim().optional().or(z.literal(""))
});

export const invoiceSchema = z.object({
  companyId: z.string().trim().min(1),
  loadNumber: z.string().trim().optional().or(z.literal("")),
  partyName: z.string().trim().min(2),
  partyContactNumber: z.string().trim().optional().or(z.literal("")),
  partyGstin: z.string().trim().optional().or(z.literal("")),
  partyPan: z.string().trim().optional().or(z.literal("")),
  partyAddress: z.string().trim().min(5),
  invoiceDate: z.string().trim().min(4),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(2),
        hsnSac: z.string().trim().optional().or(z.literal("")),
        quantity: z.coerce.number().positive(),
        rate: z.coerce.number().min(0),
        shipper: z.string().trim().optional().or(z.literal("")),
        pickupDate: z.string().trim().optional().or(z.literal("")),
        consignee: z.string().trim().optional().or(z.literal("")),
        deliveryDate: z.string().trim().optional().or(z.literal(""))
      })
    )
    .min(1),
  waitingTimeAtShipper: z.string().trim().optional().or(z.literal("")),
  shipperWaitingAmount: z.coerce.number().min(0).optional(),
  waitingTimeAtReceiver: z.string().trim().optional().or(z.literal("")),
  receiverWaitingAmount: z.coerce.number().min(0).optional(),
  otherCharges: z.coerce.number().min(0).optional(),
  remarks: z.string().trim().optional().or(z.literal("")),
  gstRate: z.coerce.number().min(0).max(100),
  gstMode: z.enum(["none", "intra", "inter"])
});
