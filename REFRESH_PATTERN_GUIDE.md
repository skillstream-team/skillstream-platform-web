# Refresh Pattern Guide

This document describes the refresh pattern implemented to ensure newly created items appear immediately when navigating back to list pages.

## Pattern Overview

The `useRefreshOnNavigation` hook automatically refreshes data when:
1. Navigating to a page (location key changes)
2. Page becomes visible (user navigates back or switches tabs)
3. Navigation state contains a refresh flag

## Implementation

### 1. Import the Hook

```typescript
import { useRefreshOnNavigation, createRefreshState } from "@/hooks/useRefreshOnNavigation"
```

### 2. Use the Hook in List Pages

Replace `hasFetched` patterns with the hook:

**Before:**
```typescript
const hasFetched = useRef(false)

useEffect(() => {
  if (hasFetched.current) return
  hasFetched.current = true
  fetchData()
}, [])
```

**After:**
```typescript
// Refresh when navigating to this page
useRefreshOnNavigation(() => {
  fetchData()
})
```

### 3. Pass Refresh Flag When Creating Items

When navigating after creation, pass the refresh flag:

```typescript
// After creating an item
toast.success("Item created successfully!")
navigate('/list-page', { state: createRefreshState() })
// or
navigate('/list-page', { state: { refresh: true } })
```

## Pages Already Updated

✅ MyCourses.tsx
✅ Courses.tsx  
✅ CreateCourse.tsx
✅ Announcements.tsx
✅ AdminCategories.tsx
✅ AdminTags.tsx
✅ AdminBundles.tsx
✅ CourseBuilder.tsx

## Pages That Need Updates

The following pages still use `hasFetched` or similar patterns and should be updated:

- AdminBanners.tsx
- AdminCoupons.tsx
- AdminEmailTemplates.tsx
- AdminWhiteboards.tsx
- AdminForums.tsx
- AdminQA.tsx
- AdminQuizzes.tsx
- AdminAnnouncements.tsx
- AdminUsers.tsx (already refreshes on delete, but should refresh on navigation)
- AdminCourses.tsx
- Messages.tsx
- CourseQA.tsx
- CourseActivity.tsx
- Enrollments.tsx
- Reviews.tsx
- StudyGoals.tsx
- LearningPaths.tsx
- BrowseCourses.tsx
- And other list pages...

## Quick Update Template

For each page:

1. **Add import:**
```typescript
import { useRefreshOnNavigation } from "@/hooks/useRefreshOnNavigation"
```

2. **Replace hasFetched pattern:**
```typescript
// Remove:
const hasFetched = useRef(false)
useEffect(() => {
  if (hasFetched.current) return
  hasFetched.current = true
  fetchData()
}, [])

// Add:
useRefreshOnNavigation(() => {
  fetchData()
})
```

3. **Update creation handlers to pass refresh flag:**
```typescript
// After successful creation
navigate('/list-page', { state: { refresh: true } })
```

## Benefits

- ✅ Newly created items appear immediately
- ✅ No manual refresh needed
- ✅ Works when navigating back
- ✅ Works when switching tabs
- ✅ Consistent pattern across all pages
- ✅ Minimal code changes required

