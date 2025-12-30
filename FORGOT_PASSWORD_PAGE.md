# Forgot Password Page

The forgot password page is referenced in the Login page but not yet implemented. This is a note for future implementation.

## Implementation Needed

Create a `ForgotPassword.tsx` page with:
- Email input field
- Submit button
- Success/error message handling
- Link back to login page

The API endpoint `/users/auth/forgot-password` already exists in AuthAPI.

## Route to Add

```tsx
<Route path="/forgot-password" element={<ProtectedRoute requireAuth={false}><ForgotPassword /></ProtectedRoute>} />
```

