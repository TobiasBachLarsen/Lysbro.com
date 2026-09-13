# Security Audit: Access Control Review

## Summary

After launching Lysbro.com, I ran a follow-up security review of the application's authentication and access-control logic, focused on meeting access, ownership checks, and admin routes. The review was a combination of manual code review and AI-assisted analysis (Claude Code), followed by manual verification and testing of every finding before it was fixed. Six issues were found and fixed, along with one notable case where a database-level control (Supabase RLS) had already prevented what code alone made look like a vulnerability. None of the issues showed signs of having been exploited in production.

## Scope and Method

The review covered:
- The Jitsi meeting-token endpoint
- Meeting detail and deletion routes
- Dashboard queries
- The authentication middleware (`/admin`, `/room`)
- The password-change flow

Each finding below was verified by reproducing the behavior, then re-tested after the fix to confirm it no longer occurred.

## Findings

### 1. Missing ownership check on the Jitsi token endpoint — High

The endpoint that issues Jitsi meeting-join tokens only checked that the caller was authenticated, not whether they were the meeting's host or an accepted invitee. Any logged-in user could obtain a valid token to join any meeting on the platform.

**Fix:** the endpoint now checks host status or accepted-invitation status before issuing a token, with a fallback path for legitimately invited guests.

### 2. Missing ownership filter on meeting detail/delete — High

Meeting detail and delete requests were not scoped to the requesting user, so a user could potentially view or delete a meeting they did not own (an IDOR — insecure direct object reference).

**Fix:** added an ownership check to both routes.

### 3. Missing user_id filter on dashboard queries — Medium

Dashboard queries were not consistently filtered by the current user, and the dashboard also failed to render correctly when it encountered an unrecognized plan value.

**Fix:** added the missing filter and corrected the plan-value handling.

### 4. `/admin` missing from the authentication middleware — High

The `/admin` route was not included in the middleware's list of protected routes, making it reachable without logging in.

**Fix:** added `/admin` to the protected-route configuration.

### 5. `/room` incorrectly blocked by the login requirement — Low (functionality/security)

The opposite problem to #4: `/room` was included in the login requirement, which broke the intentional anonymous-guest lobby flow for invited guests without accounts.

**Fix:** removed `/room` from the login requirement and re-scoped both routes correctly.

### 6. Password-change form did not call the backend — High

The password-change form displayed a success message without actually calling Supabase's password-update API. Users who "changed" their password kept their old, possibly compromised, credentials.

**Fix:** wired the form to the real Supabase update call.

## Notable finding: defense in depth via Supabase RLS

While reviewing the org/admin tables, I found no application-level access checks in the code, which initially looked like a gap. On inspection, Supabase Row Level Security policies were already enforcing access control at the database layer for those tables. This turned out to be a false positive from a code-only review, and a good reminder that access control can live in the database as well as the application. Separately, one RLS policy (`meeting_lobby` self-admit) was found to be genuinely too permissive and was tightened directly in the Supabase SQL editor.

## Conclusion

Six issues were identified and fixed, ranging from broken access control to a non-functional password-change flow, plus one case where database-level controls had already mitigated a gap that application code alone did not show. All fixes were manually verified after the change.
