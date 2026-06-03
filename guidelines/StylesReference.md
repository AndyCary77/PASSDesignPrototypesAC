# Styles Reference

This document contains the preserved styles and design system for the document management prototype.

## Brand Identity

- **Primary Brand Color**: `rgb(154, 38, 214)` - Custom purple
- **Font Family**: Barlow (400, 500, 600, 700 weights)

## Color System

### Light Mode
- Background: `#ffffff`
- Foreground: `oklch(0.145 0 0)`
- Muted: `#ececf0`
- Muted Foreground: `#717182`
- Accent: `#e9ebef`
- Destructive: `#d4183d`
- Border: `rgba(0, 0, 0, 0.1)`
- Input Background: `#f3f3f5`
- Switch Background: `#cbced4`

### Dark Mode Support
Full dark mode token system available in `/styles/globals.css`

## Typography System

### Font Sizes (CSS Variables)
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- `--text-lg`: 1.125rem (18px)
- `--text-xl`: 1.25rem (20px)
- `--text-2xl`: 1.5rem (24px)
- `--text-3xl`: 1.875rem (30px)
- `--text-4xl`: 2.25rem (36px)

### Font Weights
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Base Typography Rules
- Body: 16px (1rem), line-height 1.5
- H1: 24px, medium weight
- H2: 20px, medium weight
- H3: 18px, medium weight
- H4: 16px, medium weight
- Labels/Buttons: medium weight
- Inputs/Textareas/Selects: normal weight

## Border Radius
- `--radius`: 0.625rem (10px)
- Small: calc(var(--radius) - 4px)
- Medium: calc(var(--radius) - 2px)
- Large: var(--radius)
- Extra Large: calc(var(--radius) + 4px)

## Component Design Patterns

### Message Alert Boxes
- **Blockers** (Red): High-priority contract/assignment blockers
- **Conflicts** (Amber): Assignment conflicts (use "Conflict" terminology, not "Warning")
- **Past Visits** (Blue): Historical visit information with info icons

### Visit Cards
- Support for various care types: Personal Care, Companionship, Live-in, Sleeping Night, Waking Night, Complex Care, Shopping, Couple, Custom Care
- 12 distinct Area tags with unique color coding
- Status badges with diagonal stripe pattern for "Pending"
- Icon indicators: Visit Note, Time Critical, Users, Time Adjusted (FastForward/Rewind)

### Tooltip Popups
- **Default variant**: Standard spacing
- **Aligned header variant**: For specific alignment needs
- **Icon prefixes**: Clock, Calendar, Map Pin, Phone icons for all content types
- **Time adjustment indicators**: FastForward/Rewind icons for dynamic time changes
- **Naming conventions**:
  - "Social Group" for companionship visits
  - "Day Sit" (without "Visit") for 12-hour day shifts

### Shift/Run Cards
- Custom route icon in light grey circle
- Fine-tuned icon positioning
- Consistent font sizing with visit cards

## UI Components Available

All Radix UI components are available in `/components/ui/`:
- Accordion, Alert Dialog, Alert, Aspect Ratio
- Avatar, Badge, Breadcrumb, Button
- Calendar, Card, Carousel, Chart
- Checkbox, Collapsible, Command, Context Menu
- Dialog, Drawer, Dropdown Menu
- Form, Hover Card
- Input, Input OTP, Label
- Menubar, Navigation Menu
- Pagination, Popover, Progress
- Radio Group, Resizable
- Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider
- Sonner (Toast), Switch
- Table, Tabs, Textarea
- Toggle, Toggle Group, Tooltip

## Layout
- Max width: 1600px centered
- Page background: `bg-gray-50`
- Content cards: White background with subtle shadow and border
- Padding: 32px for main content areas

## Navigation
- Header component available at `/components/layout/Header.tsx`
- Customer info component at `/components/layout/CustomerInfo.tsx`

## Data Management
- React DnD for drag-and-drop functionality
- HTML5 Backend for DnD
- Local storage integration for persistent state

## Accessibility
- High-fidelity, accessible UI components
- Proper ARIA labels and semantic HTML
- Keyboard navigation support through Radix UI
