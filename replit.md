# Workspace

## Overview

pnpm workspace monorepo using TypeScript. PrintBloom is a professional printing business website (printbloom.online, Sri Lanka) with a product store, services pricing, special notices, admin panel, order tracking, custom order requests, invoice generation, client database, project management, financial reports, raw materials inventory, and two-factor admin authentication. Currency: Sri Lankan Rupees (Rs.).

## Admin Authentication (2FA)

Two-step hard-coded login at `/admin/login`:
- **Step 1 — Password**: `PrintBloom@LK`
- **Step 2 — PIN**: `5823`
- Auth stored in `sessionStorage` key `pb_admin_v1`; all admin routes redirect to login if not authenticated
- Logout button in sidebar footer clears session and returns to login

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (plain `zod`, NOT `zod/v4` in API routes — causes esbuild errors), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion + Lucide React + Recharts
- **PDF**: jspdf + html2canvas for invoice export

## Design

- **Primary color**: Pink `hsl(335,80%,55%)` (#d63a7e)
- **Accent color**: Coral `hsl(15,90%,58%)`
- **Fonts**: Inter (body) + Outfit (display/headings)
- **Admin sidebar**: White `#fff`, border `#f0e6f6`, active item gradient `linear-gradient(135deg, #fce7f3, #ede9fe)` with pink text `#be185d`
- **Tailwind animate**: Use `@import "tw-animate-css"` NOT `@plugin "tailwindcss-animate"`

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   └── printbloom-website/ # React + Vite website (port 24778)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## PrintBloom Website — Public Pages

- **Home** — Hero with fluid mouse-tracking blob animation, real-time stats (client count, product count, delivered orders), featured products, trust badges, reviews section, custom project CTA, bank details section (if set in admin)
- **Store** — Product catalog with category filters, search, order modal with paper type/laminate options
- **Services** — Pricing grid by category with Popular badge
- **Track Order** (/track) — Customer self-serve tracking with tracking code; shows delivery/courier info, and invoice download link when invoiceUrl is set
- **Custom Order** (/custom-order) — Custom project inquiry form with name, phone, email, service type, description, budget, deadline, and a reference file URL field (Google Drive / Dropbox links)
- **About** — Business info from site_settings
- **Contact** — Contact form, WhatsApp button, phone/email/address
- **WhatsApp Floating Button** — Popup modal with editable default message, "Send via WhatsApp" button

## Admin Panel (/admin) — No Auth Required

- **Dashboard** — Clickable stat cards (→ reports/orders), revenue area chart, order status pie, top products bar, business overview
- **All Orders** (/admin/orders) — Order list, status management, order detail, invoice generation (PDF/JPG)
- **Custom Projects** (/admin/custom-orders) — Full manage modal: delivery type (physical/courier), courier fields, quoted price, payment proof URL, invoice URL, Create Invoice button
- **Clients** (/admin/clients) — CRUD client database
- **Projects** (/admin/projects) — Project tracking with payment progress
- **Invoices** (/admin/invoices) — Generate/download PDF/JPG invoices for confirmed standard orders; tracks "issued" status per order; passes real settings (logos, bank details, terms) to invoice template
- **Reports** (/admin/reports) — Date-filtered financial reports with PDF print
- **Products** (/admin/products) — Product catalog management
- **Services** (/admin/services) — Service pricing management
- **Notices** (/admin/notices) — Special announcement banners
- **Settings** (/admin/settings) — Business info, homepage banner, contact, social/WhatsApp/TikTok, bank details, invoice settings, shipping rates; **Branding & Images** section: businessLogoUrl, bankLogoUrl, heroBgImageUrl (with live preview)

## Database Tables

- `notices` — Special announcements (type: info/warning/success/promotion, isActive flag)
- `products` — Store catalog (name, price, category, inStock, featured, sortOrder)
- `services` — Service pricing (name, price, unit, category, isPopular, sortOrder)
- `site_settings` — Website settings (businessName, ownerName, tagline, phone, email, address, whatsapp, whatsappDefaultMsg, facebook, instagram, tiktok, heroTitle, heroSubtitle, aboutText, bankName, bankAccountHolder, bankAccountNumber, bankBranch, bankSwiftCode, invoiceCurrency, invoiceTerms, shippingFirstKgRate, shippingExtraKgRate, **businessLogoUrl, bankLogoUrl, heroBgImageUrl**)
- `orders` — Customer orders (customerName, customerEmail, customerPhone, customerBusinessName, customerAddress, productName, quantity, totalPrice, status, trackingCode, orderType, adminNotes, projectTitle, budget, deadline, courier fields, **deliveryType, attachmentUrl, invoiceIssued, invoiceUrl, paymentProofUrl**). Order ID format: `PB-MAR-0001-ABC`
- `clients` — Client database (name, email, phone, company, address, notes)
- `projects` — Project tracking (clientId, title, status, totalAmount, paidAmount, dueDate, notes)

## API Routes

All under `/api`:
- `GET/POST /notices` + `PUT/DELETE /notices/:id`
- `GET/POST /products` + `PUT/DELETE /products/:id`
- `GET/POST /services` + `PUT/DELETE /services/:id`
- `GET/PUT /settings`
- `GET/POST /orders` + `PUT /orders/:id`
- `GET /orders/track/:code` — Public order tracking endpoint
- `GET/POST /clients` + `PUT/DELETE /clients/:id`
- `GET/POST /projects` + `PUT/DELETE /projects/:id`

## Important Technical Notes

- `zod/v4` import causes esbuild bundle errors in api-server route files — use plain `zod`
- Order ID format: `PB-MAR-0001-ABC` — insert first, then update tracking code using returned ID
- Custom order API: `totalPrice == null` (not `!totalPrice`) to allow Rs.0 price
- OrderTracking hook: `retry: false`, `enabled: searchCode.length > 0` to prevent 500 on null code
- `getBaseUrl()` is in `src/lib/utils.ts` — used in AdminClients, AdminProjects for fetch calls
- Admin stat cards are `<Link>` components (wouter) — clickable navigation to reports/orders

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — full typecheck with project references

## Database Migrations

Development: `pnpm --filter @workspace/db run push`
Force push: `pnpm --filter @workspace/db run push-force`
