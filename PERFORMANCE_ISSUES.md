# Performance Issues & Optimization Plan

> Generated: December 2024
> Status: Active document for tracking performance improvements

---

## Table of Contents
1. [Critical Issues (High Priority)](#critical-issues)
2. [Medium Priority Issues](#medium-priority)
3. [Low Priority / Future Improvements](#low-priority)
4. [Completed Fixes](#completed)

---

## Critical Issues

### ISSUE-001: N+1 Query in Payments Route
**Status:** [x] COMPLETED (2024-12-04)
**Priority:** HIGH
**Impact:** 10-100x more database queries than needed

**File:** `src/app/api/cases/[id]/payments/route.ts`
**Lines:** 52-73

**Current Code:**
```typescript
const paymentsWithUser = await Promise.all(
  (payments || []).map(async (payment) => {
    let approved_by_name = null;
    if (payment.approved_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', payment.approved_by)
        .single();
      approved_by_name = profile?.name || null;
    }
    return { ...payment, approved_by_name };
  })
);
```

**Problem:** For each payment, a separate query fetches the approver's profile. With 10 payments = 10 extra queries.

**Solution:** Batch fetch all profiles in a single query, then map:
```typescript
// Get unique approver IDs
const approverIds = [...new Set(
  payments?.filter(p => p.approved_by).map(p => p.approved_by) || []
)];

// Single query for all profiles
const { data: profiles } = approverIds.length > 0
  ? await supabase
      .from('profiles')
      .select('id, name')
      .in('id', approverIds)
  : { data: [] };

// Create lookup map
const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

// Map payments with names
const paymentsWithUser = payments?.map(payment => ({
  ...payment,
  approved_by_name: payment.approved_by ? profileMap.get(payment.approved_by) || null : null
})) || [];
```

---

### ISSUE-002: JSON.stringify in SWR Cache Key
**Status:** [x] COMPLETED (2024-12-04) - Migrated to React Query
**Priority:** HIGH
**Impact:** Unnecessary cache misses, re-fetches on every render

**File:** `src/lib/hooks/useTransfers.ts`
**Lines:** ~207

**Current Code:**
```typescript
const swrKey = ['transfers', paymentType, showTransferred, JSON.stringify(filters)];
```

**Problem:** `JSON.stringify(filters)` creates a new string on every render, causing SWR to think the key changed even when filters are the same.

**Solution:** Create a stable key generator:
```typescript
// Option 1: Use specific filter values instead of stringifying
const swrKey = filters
  ? ['transfers', paymentType, showTransferred, filters.search || '', filters.status || '', filters.dateFrom || '', filters.dateTo || '']
  : ['transfers', paymentType, showTransferred];

// Option 2: Use useMemo for stable key
const stableFiltersKey = useMemo(() =>
  filters ? JSON.stringify(filters) : '',
  [filters?.search, filters?.status, filters?.dateFrom, filters?.dateTo]
);
const swrKey = ['transfers', paymentType, showTransferred, stableFiltersKey];
```

---

### ISSUE-003: Client-Side Search Filtering
**Status:** [x] COMPLETED (2024-12-04) - Kept client-side (Supabase limitation with nested relations)
**Priority:** HIGH
**Impact:** Slow search with large datasets, no database index usage

**File:** `src/lib/hooks/useTransfers.ts`
**Lines:** 174-200

**Current Code:**
```typescript
// After fetching ALL data...
if (filters?.search) {
  const searchTerm = filters.search.toLowerCase();
  results = results.filter((item) => {
    const caseData = item.cases;
    const caseNumber = String(caseData?.case_number || '').toLowerCase();
    const groomName = (caseData?.groom_first_name || '').toLowerCase();
    const groomLastName = (caseData?.groom_last_name || '').toLowerCase();
    const brideName = (caseData?.bride_first_name || '').toLowerCase();
    const brideLastName = (caseData?.bride_last_name || '').toLowerCase();

    return (
      caseNumber.includes(searchTerm) ||
      groomName.includes(searchTerm) ||
      groomLastName.includes(searchTerm) ||
      brideName.includes(searchTerm) ||
      brideLastName.includes(searchTerm)
    );
  });
}
```

**Problem:** Fetches ALL transfers from DB, then filters in JavaScript memory.

**Solution:** Move search to database query:
```typescript
// In the Supabase query builder section (before fetch)
if (filters?.search) {
  const searchTerm = `%${filters.search}%`;
  query = query.or(
    `cases.case_number.ilike.${searchTerm},` +
    `cases.groom_first_name.ilike.${searchTerm},` +
    `cases.groom_last_name.ilike.${searchTerm},` +
    `cases.bride_first_name.ilike.${searchTerm},` +
    `cases.bride_last_name.ilike.${searchTerm}`
  );
}
```

**Note:** Need to verify Supabase nested filter syntax for joined tables.

---

### ISSUE-004: Translation Object in useEffect Dependencies
**Status:** [x] COMPLETED (2024-12-04)
**Priority:** HIGH
**Impact:** Infinite re-fetches, potential memory leak

**File:** `src/components/features/sick-children/BulkPaymentEntry.tsx`
**Lines:** 107-144

**Current Code:**
```typescript
useEffect(() => {
  const loadFamilies = async () => {
    // ... fetch logic
  };

  if (open) {
    loadFamilies();
  }
}, [open, selectedMonth, selectedYear, tCommon]); // tCommon is the problem!
```

**Problem:** `tCommon` from `useTranslations()` creates a new reference on every parent render, triggering the effect repeatedly.

**Solution:** Remove `tCommon` from dependencies, use it only inside the effect:
```typescript
useEffect(() => {
  const loadFamilies = async () => {
    // tCommon can be used here - it's stable enough for this purpose
  };

  if (open) {
    loadFamilies();
  }
}, [open, selectedMonth, selectedYear]); // Remove tCommon
```

---

### ISSUE-005: Mixed SWR and React Query
**Status:** [x] COMPLETED (2024-12-04) - All hooks migrated to React Query
**Priority:** MEDIUM-HIGH
**Impact:** Inconsistent caching behavior, increased bundle size, maintenance complexity

**Files using SWR:**
- `src/lib/hooks/useApplicants.ts`
- `src/lib/hooks/useCase.ts`
- `src/lib/hooks/useCaseFiles.ts`
- `src/components/features/cases/hooks/useCasePayments.ts`
- `src/lib/hooks/useTransfers.ts`

**Files using React Query:**
- `src/lib/hooks/useDashboardStats.ts`
- `src/lib/hooks/useUsers.ts`
- Various dashboard components

**Solution:** Migrate all hooks to React Query for consistency. React Query is already configured in `src/lib/providers/ReactQueryProvider.tsx` with:
- `staleTime: 60000` (1 minute)
- `refetchOnWindowFocus: false`
- `retry: 1`

**Migration pattern:**
```typescript
// Before (SWR)
const { data, error, isLoading, mutate } = useSWR(key, fetcher, options);

// After (React Query)
const { data, error, isLoading, refetch } = useQuery({
  queryKey: [key],
  queryFn: fetcher,
  staleTime: 60000,
});
```

---

## Medium Priority

### ISSUE-006: Missing useCallback for Dialog Handlers
**Status:** [ ] Not Started
**Priority:** MEDIUM
**Impact:** Unnecessary re-renders of child components

**File:** `src/app/[locale]/(app)/applicants/pending/_components/ApplicantsList.tsx`
**Lines:** 267-270, 282-284, 297-299, 312-314

**Current Code:**
```typescript
<ActionButton
  onClick={() => {
    setSelectedApplicant(row.original);
    setViewDialogOpen(true);
  }}
/>
```

**Solution:**
```typescript
const handleViewApplicant = useCallback((applicant: Applicant) => {
  setSelectedApplicant(applicant);
  setViewDialogOpen(true);
}, []);

// In JSX:
<ActionButton onClick={() => handleViewApplicant(row.original)} />
```

**Similar issues in:**
- `src/components/features/manual-transfers/ManualTransfersTable.tsx` (Lines 70-84)
- `src/components/shared/CasesFilterBar/CasesFilterBar.tsx` (Lines 150-151, 169-173)

---

### ISSUE-007: Missing React.memo for Table Cell Components
**Status:** [ ] Not Started
**Priority:** MEDIUM
**Impact:** All cells re-render when any table state changes

**Files:**
- `src/app/[locale]/(app)/transfers/_components/TransfersTable.tsx` (Lines 42-305)
- `src/app/[locale]/(app)/cases/_components/CasesList.tsx` (Lines 68-215)
- `src/app/[locale]/(app)/applicants/pending/_components/ApplicantsList.tsx` (Lines 155-325)

**Problem:** Column cell renderers are defined inline in useMemo, but the components they render aren't memoized.

**Solution:** Extract cell components and wrap with React.memo:
```typescript
// Create separate file or define before component
const StatusBadgeCell = React.memo(({ status }: { status: string }) => (
  <Badge variant={status === 'active' ? 'success' : 'default'}>{status}</Badge>
));

// In columns definition
{
  accessorKey: 'status',
  cell: ({ row }) => <StatusBadgeCell status={row.original.status} />,
}
```

---

### ISSUE-008: Expensive Date Parsing in Render
**Status:** [ ] Not Started
**Priority:** MEDIUM
**Impact:** Repeated date parsing on every comparison during sorting

**File:** `src/app/[locale]/(app)/cases/_components/WeddingCasesList.tsx`

**Problem:** 99 instances of `new Date()` found in render/sort functions:
```typescript
const sortedData = useMemo(() => {
  return [...filteredData].sort((a, b) => {
    const dateA = a.wedding_date_gregorian
      ? new Date(a.wedding_date_gregorian).getTime()  // Parsed repeatedly
      : Infinity;
    // ...
  });
}, [filteredData, sortField]);
```

**Solution:** Pre-parse dates when data is received:
```typescript
// Transform data once when fetched
const processedData = useMemo(() =>
  data?.map(item => ({
    ...item,
    _parsedWeddingDate: item.wedding_date_gregorian
      ? new Date(item.wedding_date_gregorian).getTime()
      : null
  })) || [],
  [data]
);

// Use pre-parsed value in sorting
const sortedData = useMemo(() => {
  return [...processedData].sort((a, b) => {
    const dateA = a._parsedWeddingDate ?? Infinity;
    // ...
  });
}, [processedData, sortField]);
```

**Similar issues:**
- `src/app/[locale]/(app)/applicants/pending/_components/ApplicantsList.tsx` (Lines 140-152) - `getDaysLeft` function

---

### ISSUE-009: Middleware Auth Check on Every Request
**Status:** [ ] Not Started
**Priority:** MEDIUM
**Impact:** 50-100ms added latency per page navigation

**File:** `src/middleware.ts`

**Current behavior:** Calls `supabase.auth.getUser()` which makes a database round-trip on every navigation.

**Solution options:**
1. Use `getSession()` for most checks (faster, from cookie)
2. Cache validation result
3. Only call `getUser()` for sensitive operations

```typescript
// Faster approach for general navigation
const { data: { session } } = await supabase.auth.getSession();

// Only verify with getUser() for sensitive routes
if (isSensitiveRoute(request.nextUrl.pathname)) {
  const { data: { user } } = await supabase.auth.getUser();
}
```

---

### ISSUE-010: Large Components Without Code Splitting
**Status:** [ ] Not Started
**Priority:** MEDIUM
**Impact:** Slower initial page loads

**Large files identified:**
| File | Lines | Recommendation |
|------|-------|----------------|
| `src/components/shared/FormRenderer/FormRenderer.tsx` | 693 | Split into section components |
| `src/components/features/sick-children/CleaningPaymentsTab.tsx` | 629 | Extract PaymentsList, PaymentForm, PaymentFilters |
| `src/components/features/sick-children/SendEmailsFlow.tsx` | 587 | Extract EmailEditor, EmailSender |
| `src/app/[locale]/(app)/manual-transfers/page.tsx` | 517 | Split into sub-components |
| `src/components/features/sick-children-form/SickChildrenForm.tsx` | 444 | Split by form sections |

---

### ISSUE-011: Sequential Data Fetches That Could Be Parallel
**Status:** [ ] Not Started
**Priority:** MEDIUM
**Impact:** Waterfall loading pattern

**File:** `src/components/features/cases/hooks/useCasePayments.ts`
**Lines:** 70-106

**Current Code:**
```typescript
// Two separate SWR hooks - fetch sequentially
const { data: payments } = useSWR(
  caseId ? `/api/cases/${caseId}/payments` : null,
  fetcher
);
const { data: bankDetails } = useSWR(
  caseId ? `/api/cases/${caseId}/bank-details` : null,
  fetcher
);
```

**Solution:** Combine into single API endpoint or use React Query's `useQueries`:
```typescript
// Option 1: Combined endpoint
const { data } = useSWR(
  caseId ? `/api/cases/${caseId}/payment-details` : null, // Returns both
  fetcher
);

// Option 2: Parallel queries with React Query
const results = useQueries({
  queries: [
    { queryKey: ['payments', caseId], queryFn: fetchPayments },
    { queryKey: ['bankDetails', caseId], queryFn: fetchBankDetails },
  ]
});
```

---

### ISSUE-012: Duplicate Cache Invalidation
**Status:** [ ] Not Started
**Priority:** LOW-MEDIUM
**Impact:** Minor inefficiency, extra network calls

**File:** `src/components/features/cases/hooks/useCaseFiles.ts`
**Lines:** 128-151

**Current Code:**
```typescript
// After file upload - three cache invalidations
mutate(`/api/cases/${caseId}/files`, ...);
mutate(`/api/cases/${caseId}`);
await mutate(`/api/cases/${caseId}/files`);  // Third call - duplicate!
```

**Solution:** Single invalidation or use React Query's invalidateQueries:
```typescript
await mutate(`/api/cases/${caseId}/files`);
// Only invalidate parent if structure changed
```

---

## Low Priority

### ISSUE-013: Constants Defined Inside Components
**Status:** [ ] Not Started
**Priority:** LOW
**Impact:** Minor memory allocation on each render

**File:** `src/components/features/sick-children/CleaningPaymentsTab.tsx`
**Lines:** 55-58

**Current Code:**
```typescript
const CleaningPaymentsTab = () => {
  const HEBREW_MONTHS = ['ינואר', 'פברואר', ...]; // Created every render
```

**Solution:** Move to module scope:
```typescript
const HEBREW_MONTHS = ['ינואר', 'פברואר', ...] as const;

const CleaningPaymentsTab = () => {
  // Use HEBREW_MONTHS
```

---

### ISSUE-014: Inline Style Objects in JSX
**Status:** [ ] Not Started
**Priority:** LOW
**Impact:** New object references on every render

**File:** `src/app/[locale]/(app)/cases/[id]/_components/CaseTabs.tsx`
**Lines:** 244-246

**Current Code:**
```typescript
<div style={{
  gridTemplateColumns: `repeat(${availableTabs.length}, minmax(140px, 1fr))`
}}>
```

**Solution:**
```typescript
const gridStyle = useMemo(() => ({
  gridTemplateColumns: `repeat(${availableTabs.length}, minmax(140px, 1fr))`
}), [availableTabs.length]);

<div style={gridStyle}>
```

---

### ISSUE-015: Helper Functions Defined Inside Components
**Status:** [ ] Not Started
**Priority:** LOW
**Impact:** Function recreation on each render

**File:** `src/app/[locale]/(app)/applicants/pending/_components/ApplicantsList.tsx`
**Lines:** 89-106

**Functions:**
- `getApplicantNames` (Lines 90-98)
- `getWeddingDate` (Lines 101-106)

**Solution:** Move outside component or use useCallback:
```typescript
// Option 1: Outside component
const getApplicantNames = (formData: FormData) => { ... };

// Option 2: useCallback (if needs component scope)
const getApplicantNames = useCallback((formData: FormData) => { ... }, []);
```

---

### ISSUE-016: Columns Memo with Large Dependency Array
**Status:** [ ] Not Started
**Priority:** LOW
**Impact:** Frequent column recalculation

**File:** `src/app/[locale]/(app)/transfers/_components/TransfersTable.tsx`
**Line:** 305

**Current Code:**
```typescript
const columns = useMemo(() => [...],
  [typeFilter, showTransferred, selectedIds, onToggleSelection, t, handleRowClick]
);
```

**Problem:** `t` (translation function) changes on every render, causing columns to recalculate.

**Solution:** Remove `t` from dependencies if translations are stable:
```typescript
const columns = useMemo(() => [...],
  [typeFilter, showTransferred, selectedIds, onToggleSelection, handleRowClick]
  // t removed - translations don't change at runtime
);
```

---

## Future Improvements (When Scale Increases)

### FUTURE-001: Add Pagination to Cases API
**File:** `src/app/api/cases/route.ts`
**When:** Dataset exceeds 500 cases

### FUTURE-002: Add Virtualization to Large Tables
**Files:** DataTable components
**When:** Lists regularly exceed 100 items
**Solution:** Implement `react-window` or `@tanstack/react-virtual`

### FUTURE-003: Dynamic Import for Heavy Libraries
**Library:** `@react-pdf/renderer` (large bundle)
**Solution:** `const PDFRenderer = dynamic(() => import('@react-pdf/renderer'))`

### FUTURE-004: Add Database Indexes
**When:** Query performance degrades
```sql
-- Suggested indexes
CREATE INDEX idx_cases_type_status ON cases(case_type, status);
CREATE INDEX idx_payments_status_transferred ON payments(status, transferred_at);
CREATE INDEX idx_payments_type_status ON payments(payment_type, status);
```

### FUTURE-005: Full-Text Search for Applicants
**File:** `src/app/api/applicants/route.ts`
**When:** Search performance becomes an issue with JSON fields

---

## Completed

| Issue | Completed Date | Notes |
|-------|---------------|-------|
| ISSUE-001: N+1 Query in Payments Route | 2024-12-04 | Batch fetch profiles with single `.in()` query |
| ISSUE-002: JSON.stringify in SWR Cache Key | 2024-12-04 | Migrated to React Query with stable queryKey via useMemo |
| ISSUE-003: Client-Side Search Filtering | 2024-12-04 | Kept client-side - Supabase can't `.or()` on nested relations. Migrated to React Query with stable keys |
| ISSUE-004: Translation Object in useEffect | 2024-12-04 | Removed tCommon from dependencies |
| ISSUE-005: Mixed SWR and React Query | 2024-12-04 | Migrated all 6 hooks to React Query (useApplicants, useCase, useCaseFiles, useCasePayments, useCaseTranslation, useMonthlyCapSetting) |

---

## Notes

- Bundle sizes from build analysis:
  - `/applicants/pending`: 892 kB (largest)
  - `/cases/[id]`: 739 kB
  - `/manual-transfers`: 516 kB
  - `/transfers`: 504 kB
  - Shared JS: 102 kB

- React Query configuration in `src/lib/providers/ReactQueryProvider.tsx`:
  - staleTime: 60000ms
  - refetchOnWindowFocus: false
  - retry: 1

- SWR default config uses `dedupingInterval: 5000`
