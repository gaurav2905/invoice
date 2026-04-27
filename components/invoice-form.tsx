"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { computeInvoiceTotals, formatCurrency, getLineItemAmount, labelForGstMode } from "@/lib/format";
import { Company, GstMode, Invoice, SavedInvoiceContacts, SavedParty } from "@/lib/types";

type Props = {
  companies: Company[];
  invoice?: Invoice;
  savedInvoiceContacts: SavedInvoiceContacts;
  savedParties: SavedParty[];
};

type LineItemState = {
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  shipper: string;
  pickupDate: string;
  consignee: string;
  deliveryDate: string;
};

type FormState = {
  companyId: string;
  loadNumber: string;
  partyName: string;
  partyContactNumber: string;
  partyGstin: string;
  partyPan: string;
  partyAddress: string;
  invoiceDate: string;
  lineItems: LineItemState[];
  waitingTimeAtShipper: string;
  shipperWaitingAmount: number;
  waitingTimeAtReceiver: string;
  receiverWaitingAmount: number;
  otherCharges: number;
  remarks: string;
  gstRate: number;
  gstMode: GstMode;
};

function toDateInput(date: string) {
  return date ? date.slice(0, 10) : "";
}

function createBlankItem(): LineItemState {
  return {
    description: "",
    hsnSac: "",
    quantity: 1,
    rate: 0,
    shipper: "",
    pickupDate: "",
    consignee: "",
    deliveryDate: ""
  };
}

export function InvoiceForm({ companies, invoice, savedInvoiceContacts, savedParties }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    companyId: invoice?.companyId || companies[0]?.id || "",
    loadNumber: invoice?.loadNumber || "",
    partyName: invoice?.partyName || "",
    partyContactNumber: invoice?.partyContactNumber || "",
    partyGstin: invoice?.partyGstin || "",
    partyPan: invoice?.partyPan || "",
    partyAddress: invoice?.partyAddress || "",
    invoiceDate: invoice ? toDateInput(invoice.invoiceDate) : toDateInput(new Date().toISOString()),
    lineItems:
      invoice?.lineItems?.map((item) => ({
        description: item.description,
        hsnSac: item.hsnSac,
        quantity: item.quantity,
        rate: item.rate,
        shipper: item.shipper,
        pickupDate: toDateInput(item.pickupDate),
        consignee: item.consignee,
        deliveryDate: toDateInput(item.deliveryDate)
      })) || [createBlankItem()],
    waitingTimeAtShipper: invoice?.waitingTimeAtShipper || "",
    shipperWaitingAmount: invoice?.shipperWaitingAmount || 0,
    waitingTimeAtReceiver: invoice?.waitingTimeAtReceiver || "",
    receiverWaitingAmount: invoice?.receiverWaitingAmount || 0,
    otherCharges: invoice?.otherCharges || 0,
    remarks: invoice?.remarks || "",
    gstRate: invoice?.gstRate ?? 18,
    gstMode: invoice?.gstMode || "none"
  });

  const selectedCompany = companies.find((company) => company.id === form.companyId);
  const previewNumber =
    invoice?.invoiceNumber ||
    (selectedCompany ? String(selectedCompany.invoiceCounter + 112).padStart(5, "0") : "Select a company");
  const selectedSavedParty =
    savedParties.find((party) => party.name.toLowerCase() === form.partyName.trim().toLowerCase()) || null;

  const itemsSubtotal = useMemo(
    () =>
      Number(
        form.lineItems.reduce((sum, item) => sum + getLineItemAmount(Number(item.quantity), Number(item.rate)), 0).toFixed(2)
      ),
    [form.lineItems]
  );
  const waitingSubtotal = Number((Number(form.shipperWaitingAmount) + Number(form.receiverWaitingAmount)).toFixed(2));
  const taxableAmount = Number((itemsSubtotal + waitingSubtotal + Number(form.otherCharges)).toFixed(2));
  const totals = useMemo(
    () => computeInvoiceTotals(taxableAmount, Number(form.gstRate), form.gstMode),
    [taxableAmount, form.gstMode, form.gstRate]
  );

  function applySavedParty(name: string) {
    const selectedParty = savedParties.find((party) => party.name === name);
    if (!selectedParty) return;
    setForm((current) => ({
      ...current,
      partyName: selectedParty.name,
      partyContactNumber: selectedParty.contactNumber,
      partyGstin: selectedParty.gstin,
      partyPan: selectedParty.pan,
      partyAddress: selectedParty.address
    }));
  }

  function updateLineItem(index: number, patch: Partial<LineItemState>) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  }

  function addLineItem() {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, createBlankItem()]
    }));
  }

  function removeLineItem(index: number) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.length === 1 ? current.lineItems : current.lineItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const payload = {
      ...form,
      lineItems: form.lineItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        rate: Number(item.rate)
      })),
      shipperWaitingAmount: Number(form.shipperWaitingAmount),
      receiverWaitingAmount: Number(form.receiverWaitingAmount),
      otherCharges: Number(form.otherCharges),
      gstRate: Number(form.gstRate)
    };

    const response = await fetch(invoice ? `/api/invoices/${invoice.id}` : "/api/invoices", {
      method: invoice ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Unable to save invoice.");
      return;
    }

    router.push(`/invoices/${result.invoice.id}`);
    router.refresh();
  }

  return (
    <div className="hero-grid">
      <section className="panel stack">
        <div className="section-title">
          <div>
            <span className="eyebrow">{invoice ? "Edit Invoice" : "Create Invoice"}</span>
            <h2>{invoice ? "Correct and update details" : "Build a new invoice"}</h2>
          </div>
          <span className="pill">{labelForGstMode(form.gstMode)}</span>
        </div>

        {companies.length === 0 ? (
          <div className="error-text">Add at least one company before creating an invoice.</div>
        ) : (
          <form className="stack" onSubmit={handleSubmit}>
            <section className="summary-card">
              <h3 style={{ margin: 0 }}>Invoice Details</h3>
              <div className="form-grid">
                <div className="field">
                  <label>Company</label>
                  <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} required>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Invoice Number</label>
                  <input value={previewNumber} disabled readOnly />
                </div>
                <div className="field">
                  <label>Invoice Date</label>
                  <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Load #</label>
                  <input placeholder="e.g. S37441" value={form.loadNumber} onChange={(e) => setForm({ ...form, loadNumber: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="summary-card">
              <h3 style={{ margin: 0 }}>Party Details</h3>
              <div className="form-grid">
                <div className="field full">
                  <label>Saved Party</label>
                  <select
                    value={selectedSavedParty?.name || ""}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      applySavedParty(e.target.value);
                    }}
                  >
                    <option value="">Select previously saved party</option>
                    {savedParties.map((party) => (
                      <option key={party.name} value={party.name}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label>Party Name</label>
                  <input
                    list="saved-party-names"
                    value={form.partyName}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setForm({ ...form, partyName: nextName });
                      const matchingParty = savedParties.find((party) => party.name.toLowerCase() === nextName.trim().toLowerCase());
                      if (matchingParty) applySavedParty(matchingParty.name);
                    }}
                    required
                  />
                  <datalist id="saved-party-names">
                    {savedParties.map((party) => (
                      <option key={party.name} value={party.name} />
                    ))}
                  </datalist>
                </div>
                <div className="field">
                  <label>Contact Number</label>
                  <input value={form.partyContactNumber} onChange={(e) => setForm({ ...form, partyContactNumber: e.target.value })} />
                </div>
                <div className="field">
                  <label>Party HST/GST Number</label>
                  <input value={form.partyGstin} onChange={(e) => setForm({ ...form, partyGstin: e.target.value })} />
                </div>
                <div className="field">
                  <label>Party PAN</label>
                  <input value={form.partyPan} onChange={(e) => setForm({ ...form, partyPan: e.target.value })} />
                </div>
                <div className="field full">
                  <label>Party Address</label>
                  <textarea value={form.partyAddress} onChange={(e) => setForm({ ...form, partyAddress: e.target.value })} required />
                </div>
              </div>
            </section>

            <section className="summary-card">
              <div className="section-title" style={{ marginBottom: 0 }}>
                <h3 style={{ margin: 0 }}>Line Items</h3>
                <button className="btn" onClick={addLineItem} type="button">
                  + Add Item
                </button>
              </div>
              <div className="stack">
                {form.lineItems.map((item, index) => {
                  const amount = getLineItemAmount(Number(item.quantity), Number(item.rate));
                  return (
                    <div className="line-item-card" key={index}>
                      <div className="form-grid form-grid-5">
                        <div className="field span-2">
                          <label>Description</label>
                          <input value={item.description} onChange={(e) => updateLineItem(index, { description: e.target.value })} required />
                        </div>
                        <div className="field">
                          <label>HSN/SAC</label>
                          <input value={item.hsnSac} onChange={(e) => updateLineItem(index, { hsnSac: e.target.value })} />
                        </div>
                        <div className="field">
                          <label>Qty</label>
                          <input
                            min="0.01"
                            step="0.01"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, { quantity: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="field">
                          <label>Rate</label>
                          <input
                            min="0"
                            step="0.01"
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateLineItem(index, { rate: Number(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                      <div className="line-item-amount">{formatCurrency(amount)}</div>
                      <div className="form-grid">
                        <div className="field">
                          <label>Shipper</label>
                          <select
                            value={savedInvoiceContacts.shippers.includes(item.shipper) ? item.shipper : ""}
                            onChange={(e) => {
                              if (e.target.value) updateLineItem(index, { shipper: e.target.value });
                            }}
                          >
                            <option value="">Select previously saved shipper</option>
                            {savedInvoiceContacts.shippers.map((shipper) => (
                              <option key={shipper} value={shipper}>
                                {shipper}
                              </option>
                            ))}
                          </select>
                          <textarea value={item.shipper} onChange={(e) => updateLineItem(index, { shipper: e.target.value })} />
                        </div>
                        <div className="field">
                          <label>Pick-up Date</label>
                          <input type="date" value={item.pickupDate} onChange={(e) => updateLineItem(index, { pickupDate: e.target.value })} />
                        </div>
                        <div className="field">
                          <label>Consignee</label>
                          <select
                            value={savedInvoiceContacts.consignees.includes(item.consignee) ? item.consignee : ""}
                            onChange={(e) => {
                              if (e.target.value) updateLineItem(index, { consignee: e.target.value });
                            }}
                          >
                            <option value="">Select previously saved consignee</option>
                            {savedInvoiceContacts.consignees.map((consignee) => (
                              <option key={consignee} value={consignee}>
                                {consignee}
                              </option>
                            ))}
                          </select>
                          <textarea value={item.consignee} onChange={(e) => updateLineItem(index, { consignee: e.target.value })} />
                        </div>
                        <div className="field">
                          <label>Delivery Date</label>
                          <input type="date" value={item.deliveryDate} onChange={(e) => updateLineItem(index, { deliveryDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-danger" onClick={() => removeLineItem(index)} type="button">
                          Remove Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="summary-card">
              <h3 style={{ margin: 0 }}>Waiting Times</h3>
              <div className="form-grid">
                <div className="field">
                  <label>Waiting time at shipper</label>
                  <input value={form.waitingTimeAtShipper} onChange={(e) => setForm({ ...form, waitingTimeAtShipper: e.target.value })} />
                </div>
                <div className="field">
                  <label>Shipper waiting amount</label>
                  <input
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.shipperWaitingAmount}
                    onChange={(e) => setForm({ ...form, shipperWaitingAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label>Waiting time at receiver</label>
                  <input value={form.waitingTimeAtReceiver} onChange={(e) => setForm({ ...form, waitingTimeAtReceiver: e.target.value })} />
                </div>
                <div className="field">
                  <label>Receiver waiting amount</label>
                  <input
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.receiverWaitingAmount}
                    onChange={(e) => setForm({ ...form, receiverWaitingAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label>Other Charges</label>
                  <input
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.otherCharges}
                    onChange={(e) => setForm({ ...form, otherCharges: Number(e.target.value) })}
                  />
                </div>
              </div>
            </section>

            <section className="summary-card">
              <h3 style={{ margin: 0 }}>Remarks</h3>
              <div className="field">
                <label>Additional remarks (optional)</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </div>
            </section>

            <section className="summary-card">
              <h3 style={{ margin: 0 }}>Tax & Total</h3>
              <div className="form-grid">
                <div className="field">
                  <label>HST/GST Option</label>
                  <select value={form.gstMode} onChange={(e) => setForm({ ...form, gstMode: e.target.value as GstMode })}>
                    <option value="none">Without HST/GST</option>
                    <option value="intra">With HST/GST (CGST + SGST)</option>
                    <option value="inter">With HST/GST (IGST)</option>
                  </select>
                </div>
                <div className="field">
                  <label>HST/GST Rate (%)</label>
                  <input
                    min="0"
                    max="100"
                    step="0.01"
                    type="number"
                    value={form.gstRate}
                    onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                    disabled={form.gstMode === "none"}
                  />
                </div>
              </div>
              <div className="totals-panel">
                <div className="invoice-total-row">
                  <span>Items Subtotal</span>
                  <strong>{formatCurrency(itemsSubtotal)}</strong>
                </div>
                <div className="invoice-total-row">
                  <span>Waiting Charges</span>
                  <strong>{formatCurrency(waitingSubtotal)}</strong>
                </div>
                <div className="invoice-total-row">
                  <span>Other Charges</span>
                  <strong>{formatCurrency(Number(form.otherCharges))}</strong>
                </div>
                <div className="invoice-total-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(totals.taxableAmount)}</strong>
                </div>
                <div className="invoice-total-row">
                  <span>Total Tax</span>
                  <strong>{formatCurrency(totals.totalTax)}</strong>
                </div>
                <div className="invoice-total-row grand">
                  <span>Total</span>
                  <strong>{formatCurrency(totals.totalAmount)}</strong>
                </div>
              </div>
            </section>

            {error ? <div className="error-text">{error}</div> : null}
            <button className="btn btn-primary" disabled={busy || companies.length === 0} type="submit">
              {busy ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
            </button>
          </form>
        )}
      </section>

      <aside className="panel stack">
        <div className="section-title">
          <div>
            <span className="eyebrow">Live Summary</span>
            <h2>Invoice preview</h2>
          </div>
        </div>
        <div className="summary-card">
          <strong>{previewNumber}</strong>
          <span className="muted">{selectedCompany?.name || "Choose a company"}</span>
          <span>{form.partyName || "Party name will appear here"}</span>
          {form.partyContactNumber ? <span className="muted">Contact: {form.partyContactNumber}</span> : null}
          {form.loadNumber ? <span className="muted">Load #: {form.loadNumber}</span> : null}
        </div>
        <div className="summary-card">
          <span className="muted">Line Items</span>
          <strong>{form.lineItems.length}</strong>
          <span className="muted">Items subtotal: {formatCurrency(itemsSubtotal)}</span>
        </div>
        <div className="summary-card">
          <span className="muted">HST/GST Breakdown</span>
          <strong>CGST: {formatCurrency(totals.cgst)}</strong>
          <strong>SGST: {formatCurrency(totals.sgst)}</strong>
          <strong>IGST: {formatCurrency(totals.igst)}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Grand Total</span>
          <strong>{formatCurrency(totals.totalAmount)}</strong>
          <span className="muted">{totals.totalAmountWords}</span>
        </div>
      </aside>
    </div>
  );
}
