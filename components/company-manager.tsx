"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Company } from "@/lib/types";

type Props = {
  companies: Company[];
};

type FormState = {
  name: string;
  gstin: string;
  pan: string;
  address: string;
  logoDataUrl: string;
};

const emptyForm: FormState = {
  name: "",
  gstin: "",
  pan: "",
  address: "",
  logoDataUrl: ""
};

export function CompanyManager({ companies }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function fillForm(company: Company | null) {
    setEditing(company);
    setForm(
      company
        ? {
            name: company.name,
            gstin: company.gstin,
            pan: company.pan,
            address: company.address,
            logoDataUrl: company.logoDataUrl || ""
          }
        : emptyForm
    );
    setMessage("");
    setError("");
  }

  async function onLogoChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, logoDataUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const response = await fetch(editing ? `/api/companies/${editing.id}` : "/api/companies", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await response.json().catch(() => ({}));

    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Unable to save company.");
      return;
    }

    setMessage(editing ? "Company updated." : "Company added.");
    fillForm(null);
    router.refresh();
  }

  return (
    <div className="hero-grid">
      <section className="panel stack">
        <div className="section-title">
          <div>
            <span className="eyebrow">Company Management</span>
            <h2>{editing ? "Update company" : "Add a company"}</h2>
          </div>
          {editing ? (
            <button className="btn btn-ghost" onClick={() => fillForm(null)} type="button">
              Cancel edit
            </button>
          ) : null}
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field">
            <label>Company Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>HST/GST Number</label>
            <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
          </div>
          <div className="field">
            <label>PAN</label>
            <input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
          </div>
          <div className="field">
            <label>Logo</label>
            <input accept="image/*" onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)} type="file" />
          </div>
          <div className="field full">
            <label>Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          {error ? <div className="field full error-text">{error}</div> : null}
          {message ? <div className="field full success-text">{message}</div> : null}
          <div className="field full">
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? "Saving..." : editing ? "Update Company" : "Add Company"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel stack">
        <div className="section-title">
          <div>
            <span className="eyebrow">Available Companies</span>
            <h2>{companies.length} registered</h2>
          </div>
        </div>
        <div className="stack">
          {companies.length === 0 ? (
            <div className="summary-card">
              <strong>No companies yet</strong>
              <span className="muted">Add your first company to start generating invoices.</span>
            </div>
          ) : (
            companies.map((company) => (
              <article className="summary-card" key={company.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                  <div className="stack" style={{ gap: 8 }}>
                    <strong>{company.name}</strong>
                    {company.gstin ? <span className="muted">HST/GST Number: {company.gstin}</span> : null}
                    {company.pan ? <span className="muted">PAN: {company.pan}</span> : null}
                  </div>
                  {company.logoDataUrl ? (
                    <Image alt={`${company.name} logo`} className="logo-preview" height={78} src={company.logoDataUrl} width={78} />
                  ) : null}
                </div>
                <span>{company.address}</span>
                <div className="row-actions">
                  <button className="btn" onClick={() => fillForm(company)} type="button">
                    Edit
                  </button>
                  <span className="pill">Next invoice: {String(company.invoiceCounter + 112).padStart(5, "0")}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
