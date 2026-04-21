# Skill: Admin Screens (Web Frontend)
**Project:** TechTrack Inventory System  
**Screens:** Dashboard, Asset Management, Loan Queue

---

## Overview
This skill details the exact layout, fields, behavior, and UX rules for the 3 admin-facing web screens. All admin pages require `ROLE_ADMIN` — unauthorized access redirects to `/inventory`.

---

## Admin Layout Shell

All admin pages share a persistent shell:

```
┌─────────────────────────────────────────────────────┐
│ [TechTrack Logo]                    [Admin Name ▼]  │  ← Top Navbar
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  SIDEBAR     │         PAGE CONTENT                  │
│              │                                       │
│ • Dashboard  │                                       │
│ • Inventory  │                                       │
│ • Loan Queue │                                       │
│ • Loan Hist. │                                       │
│ • Users      │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

### Sidebar Navigation Items
| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/admin/dashboard` | LayoutDashboard |
| Asset Inventory | `/admin/assets` | Package |
| Loan Queue | `/admin/loans/queue` | ClipboardList |
| Loan History | `/admin/loans/history` | History |
| User Management | `/admin/users` | Users |

- Active item: highlighted with `bg-blue-50 text-blue-700 font-medium`
- Sidebar collapses to icon-only on medium screens
- Sidebar is hidden on mobile — replaced by hamburger menu

---

## Screen 6: Admin Dashboard (`/admin/dashboard`)

### Overview Cards (top row)
5 stat cards in a responsive grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`:

| Card | Value Source | Color |
|------|-------------|-------|
| Total Assets | count all assets (non-retired) | Blue |
| Available | count `status = AVAILABLE` | Green |
| On Loan | count `status = ON_LOAN` | Blue |
| Pending Approval | count `status = PENDING_APPROVAL` | Amber |
| Under Maintenance | count `status = UNDER_MAINTENANCE` | Orange |

```tsx
// Stat Card Component
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <p className="text-sm font-medium text-gray-500">{label}</p>
  <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs mt-2 ${colorClass}`}>
    {statusLabel}
  </div>
</div>
```

### Recent Activity Feed
- Title: "Recent Activity"
- Shows last **10** loan status changes system-wide
- Each item shows:
  - Borrower name
  - Asset name
  - Status change (e.g., "Request approved")
  - Timestamp (relative: "2 hours ago")
- Fetch from `GET /loans?sort=requestedAt,desc&size=10`

### Quick Actions (optional)
- "Add New Asset" button → navigates to `/admin/assets?action=add`
- "View Loan Queue" button → navigates to `/admin/loans/queue`

### Data Refresh
- Stats auto-refresh every **60 seconds** (use `refetchInterval: 60000` in React Query)
- Manual refresh button with last-updated timestamp

---

## Screen 7: Admin — Asset Management Page (`/admin/assets`)

### Header Row
- Title: "Asset Inventory"
- "Add Asset" primary button (top right) → opens Add Asset slide-over panel

### Filter Bar
| Filter | Type |
|--------|------|
| Search | text (debounce 300ms) |
| Category | dropdown |
| Status | dropdown (all statuses including RETIRED) |

### Data Table
Columns:

| Column | Content | Sortable |
|--------|---------|---------|
| Asset Tag | `TAG-001` | Yes |
| Name | Asset name | Yes |
| Category | Category text | Yes |
| Status | Status badge | Yes |
| Last Updated | Formatted datetime | Yes |
| Actions | Edit / Retire buttons | No |

- Row hover: `hover:bg-gray-50`
- Pagination: 20 per page, show total count
- Click row to open Asset Detail slide-over (read-only view)

### Action Buttons Per Row
- **Edit** (pencil icon): Opens Edit Asset slide-over with pre-filled form
- **Retire** (archive icon): Shows confirmation modal "Are you sure you want to retire this asset? This cannot be undone from the interface."
  - Sets `status = RETIRED` (soft delete)
  - Retired assets still visible with filter `status=RETIRED`
  - Retire button hidden if asset is already RETIRED

### Add / Edit Asset Slide-Over Panel
```
┌──────────────────────────────────────┐  (slides in from right)
│ [←]  Add New Asset                   │
│                                      │
│ Name *          [___________________]│
│ Category *      [Dropdown ▼]         │
│ Asset Tag *     [___________________]│
│ Serial Number   [___________________]│
│ Description     [Textarea            │
│                  ___________________]│
│ Images          [Upload images       │
│                  drag & drop / browse]│
│ Primary Image   [select from uploaded]│
│                                      │
│ Status (Edit only): [Dropdown ▼]     │
│                                      │
│ [Cancel]      [Save Asset]           │
└──────────────────────────────────────┘
```

**Field Validation:**
- Name: Required
- Category: Required — predefined list or free text
- Asset Tag: Required, unique
- Images: JPEG/PNG only, max 5MB each

**On Save:**
- POST `/assets` (create) or PUT `/assets/{id}` (edit)
- On success: Close panel + show success toast + refresh table
- On error: Show inline error in panel

### Batch Status Update
- Checkbox on each row enables batch selection
- When 1+ rows selected, show floating bar: "X items selected — [Set to Maintenance] [Cancel]"
- Useful for bulk maintenance scenarios

---

## Screen 8: Admin — Loan Queue Page (`/admin/loans/queue`)

### Layout
- Title: "Loan Queue"
- Subtitle: "Review and process pending loan requests"
- Filter: Status tab bar — **Pending** | **Active Loans** | **All**

### Loan Queue Table (Pending tab default)
Columns:

| Column | Content |
|--------|---------|
| Borrower | Full name + student ID |
| Asset | Name + asset tag |
| Purpose | Truncated (expandable on hover/click) |
| Requested Return | Date |
| Submitted At | Relative time ("3 hours ago") |
| Actions | Approve + Reject buttons |

### Approve Action
- "Approve" button: green outline button with checkmark icon
- On click: Confirmation popover "Approve loan for [Asset]?"
- On confirm: `PUT /loans/{id}/approve`
- On success: Row disappears from Pending tab, show toast "Loan approved"

### Reject Action
- "Reject" button: red outline button with X icon
- On click: Opens rejection modal:

```
┌─────────────────────────────────────┐
│ Reject Loan Request                 │
│                                     │
│ Asset: Dell Latitude 5420           │
│ Borrower: Juan dela Cruz            │
│                                     │
│ Rejection Reason *                  │
│ [Textarea — required]               │
│                                     │
│ [Cancel]         [Confirm Reject]   │
└─────────────────────────────────────┘
```

- Rejection reason is required — disable "Confirm Reject" until filled
- On confirm: `PUT /loans/{id}/reject` with `{ rejectionReason }`
- On success: Row removed, show toast "Loan rejected"

### Active Loans Tab
Shows all `ON_LOAN` records with a **"Mark as Returned"** action:

- "Mark as Returned" button → opens return modal:

```
┌─────────────────────────────────────┐
│ Process Equipment Return            │
│                                     │
│ Asset: Dell Latitude 5420           │
│ Borrower: Juan dela Cruz            │
│                                     │
│ Condition on Return *               │
│ ● Good — return to Available        │
│ ○ Damaged — send to Maintenance     │
│                                     │
│ [Cancel]         [Confirm Return]   │
└─────────────────────────────────────┘
```

- On confirm: `PUT /loans/{id}/return` with `{ conditionOnReturn }`
- On success: Row removed, toast shown, asset status updated in dashboard

### Loan History Tab / Page (`/admin/loans/history`)
- Shows ALL loans (all statuses)
- Filters: Status dropdown, Date range picker, Borrower search
- Same table columns as queue + actual return date + condition columns
- Export to CSV button (optional/future feature)

---

## Admin User Management Page (`/admin/users`)

### Table Columns
| Column | Content |
|--------|---------|
| Name | First + Last |
| Email | Email |
| Student ID | Student ID or "-" |
| Department | Department |
| Role | Role badge |
| Status | Active / Inactive badge |
| Joined | Date |
| Actions | Toggle active / Change role |

### Actions
- **Toggle Active**: Enable/disable user account (`is_active`)
- **Change Role**: Dropdown to switch between ROLE_ADMIN and ROLE_BORROWER (with confirmation)

---

## Admin Breadcrumb Navigation
```tsx
// Example: Admin > Asset Inventory > Edit Asset
<nav className="text-sm text-gray-500">
  <span>Admin</span>
  <span className="mx-2">/</span>
  <Link to="/admin/assets" className="hover:text-blue-600">Asset Inventory</Link>
  <span className="mx-2">/</span>
  <span className="text-gray-900">Edit Asset</span>
</nav>
```

---

## Real-Time Updates (Optional Enhancement)
For the loan queue, poll every **30 seconds** to show new pending requests without a page refresh:
```typescript
const { data } = useQuery({
  queryKey: ['loans', 'pending'],
  queryFn: () => loanApi.getPendingLoans(),
  refetchInterval: 30_000,
});
```
