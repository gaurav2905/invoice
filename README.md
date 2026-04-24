# Billing Control Room

A secure, responsive invoice generator and manager built with Next.js.

## Features

- Admin login protected by an HTTP-only JWT session cookie
- Protected routes and protected API endpoints
- Company management with GSTIN, PAN, address, and optional logo
- Sequential invoice number generation per company
- Invoice creation, editing, guarded deletion, search, and sorting
- GST modes for no tax, CGST + SGST, or IGST
- Print-ready invoice view with PDF download
- Supabase-backed storage for companies and invoices

## Local Access

- Username: `admin`
- Password: `admin123`

These defaults come from `.env.local`. Change them before real-world deployment.

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor in Supabase and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy your project URL and service role key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

4. Restart the Next.js server after changing environment variables.

Notes:

- This app uses the `service_role` key on the server only. Do not expose it in client-side code.
- Existing local JSON data in `data/db.json` is not auto-migrated. If you want, we can add an import script next.
- Company logos are still stored as data URLs in the database for now, which keeps the current UI unchanged.

## Build

```bash
npm run build
npm start
```

## Notes

- Invoice deletion is intentionally restricted to the latest invoice for the same company.
- Invoice numbers follow the format `00112`, `00113`, and so on.
- PDF export is generated from the on-screen invoice layout for a consistent print result.
