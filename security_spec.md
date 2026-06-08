# Security Specification for FUUAST CS Repository

## 1. Data Invariants

1. **UserRequests**: 
   - Publicly readable by any authenticated student.
   - Creation is allowed only if `userId` matches the authenticated `request.auth.uid`.
   - Update of a request's `status` field is restricted: only authenticated users who did *not* create it (peers / reps) or are verified can update the status to `'approved'` or `'unavailable'`, and they MUST ONLY modify the `status` field.
   - Resource IDs must match alphanumeric patterns with length bounds.
   - Strict size constraints on all string inputs (e.g. `studentName` up to 100 chars, `courseName` up to 100 chars, `description` up to 1000 chars).

2. **Bookmarks & Favorites**:
   - Strictly isolated by user id (`/users/{userId}`). Only the authenticated user matching `{userId}` can read, create, or delete their own bookmarks and favorites.
   - No external updates or cross-user writes.

---

## 2. The "Dirty Dozen" Vandalism Payloads

These 12 payloads are explicitly designed to test boundaries and must return `PERMISSION_DENIED`:

### Collection: `requests`

1. **Identity Spoofing - Impersonating another student**
   - Payload: A student creates a request where `userId` is set to different user's UID.
2. **Shadow Field Injection - Unauthorized keys**
   - Payload: Adding extra administrative keys, e.g., `isAdmin: true` or `shadowField: "ghost"`.
3. **State Shortcutting - Self-approving requests**
   - Payload: A student creates a request and immediately sets `status` to `"approved"`.
4. **Denial-Of-Wallet / Key Resource Bloat**
   - Payload: Submitting a request with a 10MB `description` text.
5. **No Verification - Unverified writes**
   - Payload: Authenticated user without verification trying to write in protected paths (if email verification required).
6. **Immutable Field Tampering**
   - Payload: Updating a request's immutable fields like `studentName` or `createdAt` after creation.
7. **Bypassing Document ID Rules**
   - Payload: Injecting high-length, junk nested characters, or slash elements as the doc ID.

### Collection: `users/{userId}/bookmarks` & `favorites`

8. **Cross-User Snooping - Unauthorized read**
   - Action: User B attempting to read User A's `/users/userA/bookmarks` list.
9. **Cross-User Vandalism - Unauthorized write**
   - Action: User B attempting to delete or overwrite User A's `/users/userA/favoriteFiles/file123`.
10. **Value Poisoning - Invalid fileIds**
    - Payload: Bookmarking with an array instead of a string or with a massive 1MB string.
11. **Client-side query bypass**
    - Action: Querying `/users/{userId}/bookmarks` without filtering by the active user's ID.
12. **Zombie-like update bypass**
    - Action: Client updating bookmark fields that are defined as immutable (like `fileId`).

---

## 3. Test Cases (Security Suite Interface)

Verifying that these attacks fail under security policies inside the local emulator or actual unit tests.
All payloads return `PERMISSION_DENIED`.
