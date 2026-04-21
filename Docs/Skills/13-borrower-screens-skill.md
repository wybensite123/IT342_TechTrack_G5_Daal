# Skill: Borrower Screens (Web Frontend)
**Project:** TechTrack Inventory System  
**Screens:** Login, Register, Asset Inventory, Asset Detail, My Loans

---

## Overview
This skill details the exact layout, fields, behavior, and UX rules for all 5 borrower-facing web screens. When generating components for these screens, follow these specs precisely.

---

## Screen 1: Login Page (`/login`)

### Layout
- Centered card on a light gray background (`bg-gray-50 min-h-screen`)
- TechTrack logo at the top of the card
- Tagline: "Manage university IT equipment with ease"
- Card max-width: `max-w-md w-full`

### Fields
| Field | Type | Validation |
|-------|------|-----------|
| Email | text input | Required, valid email format |
| Password | password input (show/hide toggle) | Required |

### Actions
- **"Log In"** — Primary button, full width
- **"Register"** — Text link below form: "Don't have an account? Register"
- **"Forgot Password"** — Text link, small, below password field

### Behavior
- Show inline error below each field on blur and on submit
- On success: redirect based on role — `ROLE_ADMIN` → `/admin/dashboard`, `ROLE_BORROWER` → `/inventory`
- On failure (AUTH-001): Show toast or inline error "Invalid email or password"
- Disable "Log In" button and show spinner while request is in-flight
- Google login button: "Continue with Google" with Google icon

### Form Validation
```typescript
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

### Structure
```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
    {/* Logo */}
    {/* Title */}
    {/* Form */}
    {/* Google Login Divider */}
    {/* Register link */}
  </div>
</div>
```

---

## Screen 2: Registration Page (`/register`)

### Fields
| Field | Type | Validation |
|-------|------|-----------|
| Student/Staff ID | text | Optional, alphanumeric |
| First Name | text | Required |
| Last Name | text | Required |
| Department | dropdown | Optional — predefined list |
| Email | text | Required, valid email |
| Password | password (with strength indicator) | Required, min 8 chars |
| Confirm Password | password | Required, must match password |

### Password Strength Indicator
- Show a horizontal progress bar below the password field
- 4 levels: Weak (red), Fair (orange), Good (yellow), Strong (green)
- Evaluate: length ≥ 8, has uppercase, has number, has special character
- Display label next to bar: "Weak" / "Fair" / "Good" / "Strong"

### Department Options
```typescript
export const DEPARTMENTS = [
  'College of Computer Studies',
  'College of Engineering',
  'College of Business',
  'College of Arts and Sciences',
  'IT Department',
  'Library',
  'Other',
];
```

### Behavior
- On success: Redirect to `/login` with a success toast: "Account created! Please log in."
- On `DB-002` (duplicate email): Show inline error "An account with this email already exists"
- Disable submit button while loading

### Form Validation
```typescript
const registerSchema = z.object({
  studentId: z.string().optional(),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  department: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

---

## Screen 3: Borrower — Asset Inventory Page (`/inventory`)

### Layout
- Full-width page with top Navbar
- Filter bar below Navbar (sticky on scroll)
- Responsive card grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Pagination at bottom

### Navbar
```
[TechTrack Logo]    [Inventory]  [My Loans]    [User Avatar ▼]
```
- User avatar menu: Show name, role badge, "Log Out" option

### Filter Bar
| Filter | Type | Default |
|--------|------|---------|
| Search | text input with search icon | Empty |
| Category | dropdown | "All Categories" |
| Status | dropdown | "Available" |

- Filters are applied reactively (debounce 300ms on search)
- URL reflects filters: `/inventory?q=laptop&category=Laptop&status=AVAILABLE`
- "Clear Filters" text link appears when any filter is active

### Asset Card (see UI Component skill for full spec)
- Asset image (thumbnail 192px height)
- Name (truncated to 2 lines)
- Category badge
- Status badge (color-coded)
- "View Details" button
- "Request Loan" button — disabled unless `status === 'AVAILABLE'`

### Pagination
- Show: "Showing 1–20 of 45 results"
- Previous / Next buttons + page numbers
- Default 20 items per page

### Empty State
- When no assets match filters: "No assets found. Try adjusting your filters."

---

## Screen 4: Asset Detail Page (`/assets/:id`)

### Layout
- Two-column layout on desktop: image left, info right
- Single column stack on mobile

### Image Section (left / top)
- Image carousel if multiple images exist
- Dot indicators for carousel position
- Fallback: gray placeholder with camera icon if no images

### Info Section (right / below)
| Field | Display |
|-------|---------|
| Name | Large heading `text-2xl font-bold` |
| Asset Tag | `text-sm text-gray-500` — "TAG: TAG-001" |
| Serial Number | `text-sm text-gray-500` — "SN: SN-DELL-001" |
| Category | Category badge |
| Status | Large status badge (color-coded) |
| Description | Full description text, scrollable if long |

### Loan Request Button
- Only shown to `ROLE_BORROWER` users
- If `status === 'AVAILABLE'` → Blue primary button "Request Loan"
- If `status !== 'AVAILABLE'` → Gray disabled button with tooltip: "This item is not available"
- Clicking opens the Loan Request Modal

### Loan Request Modal
```
┌─────────────────────────────┐
│ Request Loan: [Asset Name]  │
│                             │
│ Purpose *                   │
│ [Textarea - min 10 chars]   │
│                             │
│ Return Date *               │
│ [Date Picker - max 7 days]  │
│                             │
│ [Cancel]    [Submit Request]│
└─────────────────────────────┘
```

- Date picker: min = tomorrow, max = today + 7 days
- On submit: call `POST /loans`, then show success toast and close modal
- On error: show inline error in modal (do not close)

---

## Screen 5: My Loans Page (`/my-loans`)

### Layout
- Page title: "My Loans"
- Tabbed view: **Active Loans** | **Past Loans**
- Table/list view of loan records

### Tab: Active Loans
Shows loans with status `PENDING_APPROVAL` or `ON_LOAN`

### Tab: Past Loans
Shows loans with status `RETURNED` or `REJECTED`

### Loan Row
| Column | Content |
|--------|---------|
| Asset | Thumbnail + name |
| Requested Date | Formatted date |
| Return Date | Formatted date |
| Status | Status badge (color-coded) |
| Action | "View" button → opens detail modal |

### Status Badge Colors (Loan)
| Status | Color |
|--------|-------|
| PENDING_APPROVAL | Amber |
| ON_LOAN | Blue |
| RETURNED | Green |
| REJECTED | Red |

### Loan Detail Modal (on "View")
Shows full loan details including:
- Asset name + tag
- Purpose
- Requested and return dates
- Approval date (if approved)
- Actual return date (if returned)
- Rejection reason (if rejected)
- Return condition (if returned)

### Empty State
- Active tab: "You have no active loans. Browse inventory to request equipment."
- Past tab: "No past loans found."

---

## Navigation Rules
- Borrower cannot navigate to any `/admin/*` route — redirect to `/inventory`
- Unauthenticated user accessing any protected route → redirect to `/login`
- After login, redirect to previously attempted page (use `location.state.from`)

---

## Toast Notifications
Use a toast library (e.g., `react-hot-toast`) for feedback:

```typescript
// Success
toast.success('Loan request submitted successfully!');

// Error
toast.error('Something went wrong. Please try again.');
```
