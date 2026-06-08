# CareRequirementsFlow

## Project Purpose

A UX/design prototype exploring improvements to the flow for:
- Adding **care requirements** to customer visits (mandatory, preferred, excluded careworkers/criteria)
- Assigning **skills and restrictions** to carers (employee matching profile)

The goal is to validate interaction patterns before implementation in a production care management platform (PASS — Platform for Active and Supported Services). This is not a production app — there is no backend, no auth, and all data is mocked.

## Tech Stack

- **React 18** + **TypeScript** + **Vite 6**
- **React Router v7** (data router pattern)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **shadcn/ui** components built on **Radix UI** primitives
- **React DnD** for drag-and-drop interactions
- **Lucide React** + **MUI Icons** for iconography
- Package manager: **pnpm**

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
```

## Project Structure

```
src/
  main.tsx                        # ReactDOM entrypoint
  app/
    App.tsx                       # RouterProvider wrapper
    routes.tsx                    # Route definitions (customer + employee layouts)
    components/
      layout/
        Header.tsx                # Top nav bar (purple, #6d1b98)
        CustomerInfo.tsx          # Customer profile header + tab nav
        EmployeeInfo.tsx          # Employee profile header
      rostering/
        RosteringLayout.tsx       # Left sidebar nav + content area for rostering sections
        CareRequirementsPage.tsx  # Care requirements view (customer-level defaults)
      customer/
        ServiceAgreementPage.tsx  # Visit cards with per-visit care requirement overrides
      employee/
        EmployeeDetailsPage.tsx   # Employee profile + Roster Matching Profile (skills, restrictions)
      alerts/
        CombinedAlerts.tsx        # Blockers, conflicts, and historical visit alerts
      appointments/
        AppointmentPanel.tsx      # Appointment scheduling UI
      documents/                  # Document list, filters, tabs
      ui/                         # shadcn/ui component library (60+ components)
      icons/                      # Custom SVG icons (TimeCritical, TimeAdjusted, VisitNote, Users)
    data/
      mock-documents.ts           # Static mock data
    types/
      document.ts
    imports/
      pasted_text/                # Figma/HTML design reference files (read-only reference)
guidelines/
  Guidelines.md                   # Dev guidelines
  StylesReference.md              # Design system reference (colours, typography, spacing)
```

## Key Flows Being Prototyped

### 1. Customer Care Requirements
Located in `CareRequirementsPage.tsx` and `ServiceAgreementPage.tsx`.

Four sections apply at both the **customer default level** and as **per-visit overrides**:
- **Mandatory** — only these criteria/careworkers can be scheduled
- **Preferred** — priority scheduling, not exclusive
- **Preferred Employees** — specific careworkers to prioritise
- **Excluded Careworkers** — specific careworkers who cannot be scheduled

### 2. Employee Roster Matching Profile
Located in `EmployeeDetailsPage.tsx`.

Four sections on the employee side mirror the customer requirements:
- **Skills & Work Criteria** — e.g. `Training: Peg Feeding`, `Area: Tamworth & Lichfield`
- **Restrictions** — e.g. `Allergy: Pets`
- **Preferred Customers** — customers this carer prefers
- **Excluded Customers** — customers this carer cannot be scheduled with

### 3. Visit Scheduling
Located in `ServiceAgreementPage.tsx`. Visits have a cadence (e.g. BiWeekly), duration, care type, funder, and their own care requirement overrides that take precedence over customer defaults.

## Design System

Defined in `guidelines/StylesReference.md` and `src/styles/`.

- **Primary colour**: `rgb(154, 38, 214)` (purple)
- **Font**: Barlow (400, 500, 600, 700)
- **Border radius**: 10px
- **Page background**: `bg-gray-50`, max-width 1600px
- **Tag variants**: default (purple), preferred (gold), excluded (red) — see `src/app/components/ui/tag.tsx`
- **Care type badges** and **area tags** have 12 colour-coded region variants

Reference HTML files in `src/app/imports/pasted_text/` are exported Figma design specs — treat them as read-only design references, not source of truth for implementation.

## Routing

| Path | Layout |
|------|--------|
| `/`, `/customers` | Header → CustomerInfo → RosteringLayout (with DnD Provider) |
| `/employees` | Header → EmployeeInfo → EmployeeDetailsPage |

## Notes

- All data is static/mocked — no API calls
- DnD context is provided at the customer layout level via React DnD HTML5 Backend
- The `pnpm.overrides` field has been removed from `package.json`; build approvals for `@tailwindcss/oxide` and `esbuild` are configured in `pnpm-workspace.yaml`
