# Skill: UI Component & Design System
**Project:** TechTrack Inventory System  
**Stack:** React 18 + TypeScript + Tailwind CSS

---

## Overview
This skill defines the design system for TechTrack's web frontend — colors, typography, spacing, breakpoints, component patterns, and status color coding. All UI code must follow this system for visual consistency.

---

## Color Palette

| Token | Hex | Tailwind Class | Usage |
|-------|-----|---------------|-------|
| Primary | `#2563EB` | `bg-blue-600` | Buttons, links, active states |
| Primary Dark | `#1D4ED8` | `bg-blue-700` | Hover state for primary |
| Secondary | `#7C3AED` | `bg-violet-600` | Secondary actions, highlights |
| Success | `#10B981` | `bg-emerald-500` | Success states, AVAILABLE badge |
| Warning | `#F59E0B` | `bg-amber-500` | Pending states, PENDING_APPROVAL badge |
| Error | `#EF4444` | `bg-red-500` | Error states, REJECTED badge |
| Info | `#3B82F6` | `bg-blue-500` | ON_LOAN badge |
| Gray 50 | `#F9FAFB` | `bg-gray-50` | Page backgrounds |
| Gray 100 | `#F3F4F6` | `bg-gray-100` | Card backgrounds |
| Gray 700 | `#374151` | `text-gray-700` | Body text |
| Gray 900 | `#111827` | `text-gray-900` | Headings |
| White | `#FFFFFF` | `bg-white` | Cards, modals |

---

## Asset & Loan Status Colors

```typescript
// src/utils/statusColors.ts

export const assetStatusConfig: Record<AssetStatus, { label: string; classes: string }> = {
  AVAILABLE:         { label: 'Available',       classes: 'bg-emerald-100 text-emerald-800' },
  PENDING_APPROVAL:  { label: 'Pending Approval', classes: 'bg-amber-100 text-amber-800' },
  ON_LOAN:           { label: 'On Loan',          classes: 'bg-blue-100 text-blue-800' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', classes: 'bg-orange-100 text-orange-800' },
  RETIRED:           { label: 'Retired',          classes: 'bg-gray-100 text-gray-500' },
};

export const loanStatusConfig: Record<LoanStatus, { label: string; classes: string }> = {
  PENDING_APPROVAL: { label: 'Pending',  classes: 'bg-amber-100 text-amber-800' },
  ON_LOAN:          { label: 'On Loan',  classes: 'bg-blue-100 text-blue-800' },
  RETURNED:         { label: 'Returned', classes: 'bg-emerald-100 text-emerald-800' },
  REJECTED:         { label: 'Rejected', classes: 'bg-red-100 text-red-800' },
};
```

---

## Typography

**Font Family:** Inter (via Google Fonts)

```html
<!-- In index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```javascript
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    }
  }
}
```

| Style | Tailwind | Usage |
|-------|---------|-------|
| Page Title | `text-2xl font-bold text-gray-900` | H1 headings |
| Section Title | `text-lg font-semibold text-gray-900` | Card titles, section headers |
| Body | `text-sm text-gray-700` | Default body text |
| Caption | `text-xs text-gray-500` | Timestamps, helper text |
| Label | `text-sm font-medium text-gray-700` | Form labels |
| Link | `text-blue-600 hover:text-blue-800 underline` | Inline links |

---

## Spacing System

**Base unit:** 8px grid  
Tailwind spacing scale aligns with this (`p-2 = 8px`, `p-4 = 16px`, `p-6 = 24px`, `p-8 = 32px`)

| Usage | Tailwind |
|-------|---------|
| Card padding | `p-6` |
| Form field gap | `gap-4` |
| Section gap | `gap-6` |
| Page padding | `px-4 py-6 sm:px-6 lg:px-8` |
| Button padding | `px-4 py-2` (sm) / `px-6 py-3` (md) |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Tailwind Prefix |
|-----------|----------|----------------|
| Mobile | 0px | (default) |
| Small | 640px | `sm:` |
| Tablet | 768px | `md:` |
| Desktop | 1024px | `lg:` |
| Wide | 1280px | `xl:` |

### Asset Grid Responsiveness
```tsx
// 3 columns desktop, 2 tablet, 1 mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## Core Component Patterns

### Badge (Status)
```tsx
// src/components/common/Badge.tsx
interface BadgeProps {
  status: AssetStatus | LoanStatus;
  type: 'asset' | 'loan';
}

export const Badge = ({ status, type }: BadgeProps) => {
  const config = type === 'asset'
    ? assetStatusConfig[status as AssetStatus]
    : loanStatusConfig[status as LoanStatus];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
};
```

### Button
```tsx
// Variants: primary, secondary, danger, ghost
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium',
  secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium',
  ghost: 'text-blue-600 hover:bg-blue-50 font-medium',
};

// Sizes: sm, md, lg
const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// Base classes always applied
const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
```

### Input Field
```tsx
// Standard input styling
const inputClasses = `
  w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  placeholder:text-gray-400
  disabled:bg-gray-50 disabled:text-gray-500
`;

// Error state
const inputErrorClasses = `
  border-red-300 focus:ring-red-500
`;
```

### Card
```tsx
// Standard card container
const cardClasses = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden';
const cardPadding = 'p-6';
```

### Modal
```tsx
// Modal overlay and container
const overlayClasses = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
const modalClasses = 'bg-white rounded-xl shadow-xl w-full max-w-md mx-auto';
```

---

## Asset Card Component

```tsx
// src/components/assets/AssetCard.tsx
export const AssetCard = ({ asset, onRequestLoan }: AssetCardProps) => {
  const { isBorrower } = useAuth();
  const primaryImage = asset.images.find(img => img.isPrimary) || asset.images[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-48 bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={`${API_BASE_URL}/files/${primaryImage.filePath}`}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{asset.name}</h3>
          <Badge status={asset.status} type="asset" />
        </div>
        <p className="text-xs text-gray-500 mb-1">{asset.category}</p>
        <p className="text-xs text-gray-400">{asset.assetTag}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Link to={`/assets/${asset.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">View Details</Button>
        </Link>
        {isBorrower && (
          <Button
            variant="primary"
            size="sm"
            disabled={asset.status !== 'AVAILABLE'}
            onClick={() => onRequestLoan(asset)}
          >
            Request
          </Button>
        )}
      </div>
    </div>
  );
};
```

---

## Form Validation Pattern (React Hook Form + Zod)

```typescript
// Example: Loan Request Form
const loanSchema = z.object({
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  requestedReturnDate: z.string().refine((date) => {
    const selected = new Date(date);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    return selected > today && selected <= maxDate;
  }, 'Return date must be within 7 days from today'),
});

const { register, handleSubmit, formState: { errors } } = useForm<LoanFormData>({
  resolver: zodResolver(loanSchema),
});
```

---

## Loading & Error States

### Loading Skeleton (Asset Grid)
```tsx
// Show 6 skeleton cards while loading
{isLoading && Array.from({ length: 6 }).map((_, i) => (
  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
))}
```

### Error Display
```tsx
{error && (
  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
    <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
  </div>
)}
```

### Empty State
```tsx
{!isLoading && assets.length === 0 && (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
    <p className="text-base font-medium">No assets found</p>
    <p className="text-sm mt-1">Try adjusting your filters</p>
  </div>
)}
```

---

## Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8' },
        secondary: '#7C3AED',
      },
    },
  },
  plugins: [],
}
```
