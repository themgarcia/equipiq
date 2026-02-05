

# Admin Dashboard Improvements Plan

## Overview

This plan implements the three best-practice improvements identified in the audit, focusing on maintainability, UX consistency, and performance without adding unnecessary complexity.

## Current State Analysis

| Area | Current State | Issue |
|------|---------------|-------|
| File Size | `AdminDashboard.tsx` is 2,144 lines | Difficult to maintain, slow to navigate |
| Users Tab | No search, filter, or pagination | Inconsistent with other tabs (Activity, Errors) |
| Last Active | Not tracked | No visibility into user engagement |

## Changes

### 1. Extract Tab Components

Split the monolithic `AdminDashboard.tsx` into focused component files following the existing pattern established by `UserActivityTab.tsx`, `ErrorLogTab.tsx`, and `EntrySourcesTab.tsx`.

**New Files:**

| File | Lines Extracted | Content |
|------|-----------------|---------|
| `src/components/admin/UsersTab.tsx` | ~350 lines | Users table, search/filters, user details sheet |
| `src/components/admin/FeedbackTab.tsx` | ~250 lines | Feedback list, reply system, status management |
| `src/components/admin/AdminActivityTab.tsx` | ~180 lines | Admin action log with filters |
| `src/components/admin/MarketInsightsTab.tsx` | ~200 lines | Industry, size, revenue, region charts |
| `src/components/admin/EquipmentDataTab.tsx` | ~100 lines | Category and financing charts |
| `src/components/admin/FinancingTab.tsx` | ~100 lines | Financing breakdown table |
| `src/components/admin/MarketingTab.tsx` | ~150 lines | Referral sources, email tools |

**Result:** `AdminDashboard.tsx` reduces from ~2,144 lines to ~400 lines (overview cards, tabs container, shared state).

### 2. Add Search and Filters to Users Tab

Match the UX patterns already established in `UserActivityTab.tsx` and `ErrorLogTab.tsx`:

**Features to Add:**

| Feature | Implementation |
|---------|---------------|
| Search | Text input filtering by name, company, email |
| Plan Filter | Dropdown: All, Free, Beta, Professional, Business |
| Industry Filter | Dropdown populated from unique industries |
| Date Range | From/To calendar pickers for join date |
| Admin Filter | Dropdown: All, Admin Only, Non-Admin |
| Export CSV | Download button for filtered results |
| Pagination | Page size selector (25/50/100) with navigation |
| User Count | Display "Showing X of Y users" |

**Filter Bar Layout:**
```text
+--------------------------------------------------+
| [Search...         ] [Plan ▼] [Industry ▼]       |
| [From] [To] [Clear dates] [Admin ▼]   [Export]   |
| Showing 25 of 142 users        [< Prev] [Next >] |
+--------------------------------------------------+
```

### 3. Add "Last Active" Column

Derive last active timestamp from existing `user_activity_log` table without adding new database writes.

**Implementation:**

- Query `user_activity_log` to get `MAX(created_at)` grouped by `user_id`
- Join with user stats during data fetch
- Display relative time (e.g., "2 hours ago", "Yesterday", "3 days ago")
- Add "Last Active" column to Users table
- Add sort option for last active (most recent first)

**Query Pattern:**
```sql
SELECT user_id, MAX(created_at) as last_active
FROM user_activity_log
GROUP BY user_id
```

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/pages/AdminDashboard.tsx` | Refactor | Keep overview + tabs shell, import new tab components |
| `src/components/admin/UsersTab.tsx` | Create | Users management with search, filters, pagination, last active |
| `src/components/admin/FeedbackTab.tsx` | Create | Feedback management extracted from dashboard |
| `src/components/admin/AdminActivityTab.tsx` | Create | Admin action log extracted from dashboard |
| `src/components/admin/MarketInsightsTab.tsx` | Create | Market charts extracted from dashboard |
| `src/components/admin/EquipmentDataTab.tsx` | Create | Equipment category charts |
| `src/components/admin/FinancingTab.tsx` | Create | Financing breakdown |
| `src/components/admin/MarketingTab.tsx` | Create | Referral sources and email tools |

## Implementation Order

1. **Phase 1:** Create `UsersTab.tsx` with search, filters, pagination, and last active
2. **Phase 2:** Extract `FeedbackTab.tsx` and `AdminActivityTab.tsx`
3. **Phase 3:** Extract `MarketInsightsTab.tsx`, `EquipmentDataTab.tsx`, `FinancingTab.tsx`, `MarketingTab.tsx`
4. **Phase 4:** Update `AdminDashboard.tsx` to import and use new components

## Technical Details

### Shared State Management

The following state will remain in `AdminDashboard.tsx` and be passed as props to child components:

- `userStats` - Core user data needed by multiple tabs
- `currentUserId` - For disabling self-modification actions
- Action handlers: `deleteUser`, `updateUserPlan`, `toggleAdminRole`, `startImpersonation`

### Last Active Query Optimization

To avoid N+1 queries, fetch last active timestamps in a single batch:

```typescript
const { data: lastActiveData } = await supabase
  .from('user_activity_log')
  .select('user_id, created_at')
  .order('created_at', { ascending: false });

// Group by user_id, take first (most recent) entry
const lastActiveMap = new Map<string, string>();
lastActiveData?.forEach(entry => {
  if (!lastActiveMap.has(entry.user_id)) {
    lastActiveMap.set(entry.user_id, entry.created_at);
  }
});
```

### Pagination Implementation

Client-side pagination using the existing fetched data:

```typescript
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const paginatedUsers = filteredUsers.slice(
  (page - 1) * pageSize,
  page * pageSize
);

const totalPages = Math.ceil(filteredUsers.length / pageSize);
```

## Summary

| Improvement | Benefit |
|-------------|---------|
| Component extraction | Easier maintenance, faster navigation, better code organization |
| Users tab filters | UX consistency with other tabs, better user discovery |
| Last active tracking | Identify engaged vs inactive users without new DB writes |

