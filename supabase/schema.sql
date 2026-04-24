create table if not exists public.companies (
  id text primary key,
  name text not null,
  gstin text not null,
  pan text not null,
  address text not null,
  logo_data_url text,
  invoice_counter integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoices (
  id text primary key,
  company_id text not null references public.companies(id) on delete restrict,
  invoice_number text not null,
  sequence integer not null,
  load_number text,
  party_name text not null,
  party_contact_number text,
  party_gstin text,
  party_pan text,
  party_address text not null,
  invoice_date date not null,
  line_items jsonb not null default '[]'::jsonb,
  items_subtotal numeric(12, 2) not null default 0,
  waiting_time_at_shipper text,
  shipper_waiting_amount numeric(12, 2) not null default 0,
  waiting_time_at_receiver text,
  receiver_waiting_amount numeric(12, 2) not null default 0,
  other_charges numeric(12, 2) not null default 0,
  remarks text,
  taxable_amount numeric(12, 2) not null default 0,
  gst_rate numeric(8, 2) not null default 0,
  gst_mode text not null check (gst_mode in ('none', 'intra', 'inter')),
  cgst numeric(12, 2) not null default 0,
  sgst numeric(12, 2) not null default 0,
  igst numeric(12, 2) not null default 0,
  total_tax numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  total_amount_words text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, sequence),
  unique (invoice_number)
);

create index if not exists invoices_company_id_idx on public.invoices(company_id);
create index if not exists invoices_invoice_date_idx on public.invoices(invoice_date desc);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);

alter table public.companies enable row level security;
alter table public.invoices enable row level security;

create policy "Allow service role full access on companies"
on public.companies
as permissive
for all
to service_role
using (true)
with check (true);

create policy "Allow service role full access on invoices"
on public.invoices
as permissive
for all
to service_role
using (true)
with check (true);
