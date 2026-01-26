# Watchlist API Implementation Guide

**Date**: January 25, 2026  
**Status**: Pre-Implementation Analysis ✅ **VALIDATED - SAFE TO PROCEED**

---

## Executive Summary

✅ **The approach is CORRECT and WON'T BREAK anything**

Your codebase architecture is well-suited for adding Watchlist API routes. The authentication system (Better Auth), database setup (Mongoose/MongoDB), and middleware are already in place and compatible with the proposed API implementation.

---

## Current Architecture Analysis

### 1. Authentication System ✅
**File**: [lib/better-auth/auth.ts](lib/better-auth/auth.ts)

**Current Setup**:
- Better Auth is initialized with MongoDB adapter
- Session cookies are automatically handled by Better Auth
- User collection stored in MongoDB with `_id`, `email`, `name`, `image` fields

**API Compatibility**:
- ✅ Better Auth provides `auth.api.getSession()` for server-side auth
- ✅ Session cookies are sent automatically with requests
- ✅ Can extract `userId` from session headers in API routes
- ✅ No changes needed to auth system

**How to use in API routes**:
```typescript
// In app/api/watchlist/route.ts
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id; // Ready to use
}
```

---

### 2. Database & Mongoose Setup ✅
**File**: [database/mongoose.ts](database/mongoose.ts)

**Current Setup**:
- Connection pooling already implemented
- Watchlist model exists: [database/models/watchlist.model.ts](database/models/watchlist.model.ts)
- Schema has proper indexes (unique constraint on userId + symbol)

**API Compatibility**:
- ✅ Can call `connectToDatabase()` in API routes (already done in [lib/actions/watchlist.actions.ts](lib/actions/watchlist.actions.ts))
- ✅ Watchlist model is ready to use
- ✅ No schema changes needed
- ✅ Error handling pattern established

**Database Operations Ready**:
```typescript
// Already tested and working in server actions
await Watchlist.create({ userId, symbol, company });
await Watchlist.find({ userId });
await Watchlist.deleteOne({ userId, symbol });
```

---

### 3. Middleware Configuration ✅
**File**: [middleware/index.ts](middleware/index.ts)

**Current Setup**:
```typescript
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
]
```

**Important**: API routes are **EXCLUDED** from middleware  
- Middleware only protects UI routes
- API routes won't be redirected by middleware
- ✅ API routes need their own authentication check

**No changes needed** - just ensure each API endpoint checks auth

---

### 4. Existing API Route Pattern ✅
**File**: [app/api/inngest/route.ts](app/api/inngest/route.ts)

**Current Pattern**:
```typescript
export const {GET,POST,PUT} = serve({
    client: inngest,
    functions: [sendSignUpEmail,sendDailyNewsSummary],
})
```

**Your New Pattern Will Be**:
```typescript
// app/api/watchlist/route.ts
export async function GET(req: Request) { }
export async function POST(req: Request) { }

// app/api/watchlist/[symbol]/route.ts  
export async function DELETE(req: Request) { }
```

**No conflicts** - different route paths

---

## Critical Validations ✅

### Issue #1: Cross-User Access Prevention
**Risk**: User A could modify User B's watchlist

**Current Protection**:
```typescript
// app/(root)/layout.tsx shows how to extract user
const session = await auth.api.getSession({ headers: await headers() })
const userId = session.user.id // Unique to authenticated user
```

**Implementation**:
- Always verify `session.user.id` matches the userId in database query
- Example: `Watchlist.deleteOne({ userId: session.user.id, symbol })`
- This ensures user can only access their own watchlist

**Status**: ✅ Will be enforced in every endpoint

---

### Issue #2: Duplicate Watchlist Entries
**Current Protection**: Schema has compound unique index
```typescript
// From watchlist.model.ts
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });
```

**Implementation**:
- MongoDB will reject duplicate entries automatically
- Catch error and return appropriate response (409 or 200)
- Example: `E11000 duplicate key error`

**Status**: ✅ Database handles this

---

### Issue #3: User Authentication in API Routes
**Challenge**: How to get user session in API routes?

**Solution Pattern** (from [app/(root)/layout.tsx](app/(root)/layout.tsx)):
```typescript
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({
  headers: await headers()
});

if (!session?.user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Status**: ✅ Pattern already exists in codebase, just copy it

---

## No Breaking Changes Expected ✅

### Existing Code That Won't Be Affected

| Component | Why Safe | Evidence |
|-----------|----------|----------|
| Better Auth | API routes don't interfere | Independent auth system |
| Middleware | API routes excluded | Middleware config matcher |
| Database | Additive only | New routes only read/write watchlist |
| Inngest | Different route path | `/api/inngest` vs `/api/watchlist` |
| Watchlist Schema | No changes needed | Supports all CRUD operations |
| Server Actions | Will continue working | API routes are alternative access |
| Components | Will be enhanced | WatchlistButton will use new routes |

---

## Step-by-Step Implementation (SAFE ORDER)

### Phase 1: Setup ✅ Lowest Risk
```
1. Create file structure
   - app/api/watchlist/route.ts
   - app/api/watchlist/[symbol]/route.ts

2. Import necessary dependencies
   - auth, headers from better-auth
   - connectToDatabase, Watchlist model
   - NextRequest, NextResponse
```

**Why Safe**: Just file structure, no changes to existing files

---

### Phase 2: Implement GET /api/watchlist ✅ Read-Only
```
1. Extract session
2. Query watchlist from MongoDB
3. Return formatted response

No mutations, safe to test independently
```

**Why Safe**: Read-only operation

---

### Phase 3: Implement POST /api/watchlist ✅ Create with Guards
```
1. Extract and validate session
2. Validate request body (symbol, company)
3. Create watchlist entry
4. Handle duplicate gracefully

Insert-only, unique index prevents duplicates
```

**Why Safe**: Insert-only, database constraints protect integrity

---

### Phase 4: Implement DELETE /api/watchlist/[symbol] ✅ Delete with Ownership Check
```
1. Extract and validate session
2. Delete by (userId, symbol)
3. Return success

Ownership check ensures user can only delete their items
```

**Why Safe**: Ownership verification ensures user isolation

---

### Phase 5: Connect WatchlistButton ⚠️ Requires Testing
```
1. Modify onWatchlistChange to call new routes
2. Add error handling
3. Refresh UI based on response

SHOULD TEST THOROUGHLY before merging to main
```

**Why Careful**: First integration with frontend

---

## Code Patterns to Follow (From Your Codebase)

### Pattern #1: Server Action with Error Handling
**File**: [lib/actions/watchlist.actions.ts](lib/actions/watchlist.actions.ts)
```typescript
export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    // operation
    return result;
  } catch (error) {
    console.error('Error:', error);
    return []; // Graceful fallback
  }
};
```

**Apply to**: Error handling in API routes

---

### Pattern #2: Session Extraction
**File**: [app/(root)/layout.tsx](app/(root)/layout.tsx)
```typescript
const session = await auth.api.getSession({
  headers: await headers()
});
if(!session?.user){redirect('/sign-in')}
```

**Apply to**: Every API route that needs authentication

---

### Pattern #3: Database Connection
**File**: [lib/actions/user.actions.ts](lib/actions/user.actions.ts)
```typescript
const mongoose = await connectToDatabase();
const db = mongoose.connection.db;
if (!db) throw new Error("Database connection not found");
```

**Apply to**: API routes that query database

---

### Pattern #4: Response Format
**File**: [lib/actions/auth.actions.ts](lib/actions/auth.actions.ts)
```typescript
return { success: true, data: response }
return { success: false, error: 'Sign in failed' }
```

**Apply to**: Consistent JSON responses

---

## File Structure to Create

```
app/api/
├── watchlist/
│   ├── route.ts              # GET, POST handlers
│   └── [symbol]/
│       └── route.ts          # DELETE handler
└── inngest/
    └── route.ts              # (existing - no changes)
```

---

## Environment Variables Check ✅

**Required** (already in your setup):
- ✅ `BETTER_AUTH_SECRET` - For auth
- ✅ `BETTER_AUTH_URL` - For auth
- ✅ `MONGODB_URI` - For database

**Additional** (if you add):
- ⚠️ None needed for watchlist API specifically
- API routes will use existing environment

---

## Testing Checklist

### Before Implementation
- [ ] Review [lib/better-auth/auth.ts](lib/better-auth/auth.ts)
- [ ] Review [database/models/watchlist.model.ts](database/models/watchlist.model.ts)
- [ ] Verify MongoDB is running locally

### After Implementing Each Endpoint
- [ ] GET: Returns user's watchlist (test with curl/Postman)
- [ ] POST: Adds stock successfully
- [ ] POST: Rejects duplicates gracefully  
- [ ] DELETE: Removes stock successfully
- [ ] DELETE: Handles non-existent stock gracefully
- [ ] All: Returns 401 for unauthenticated requests

### Integration Testing
- [ ] WatchlistButton calls POST on add
- [ ] WatchlistButton calls DELETE on remove
- [ ] Changes persist after page refresh
- [ ] Cross-user isolation verified (User A can't see User B's list)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Breaking auth | Low | High | Use existing session pattern |
| Breaking database | Low | High | Use lean() queries, don't mutate schema |
| Cross-user access | Low | Critical | Always verify `userId` in queries |
| Duplicate entries | Low | Medium | Database constraint + error handling |
| Performance | Low | Low | Use indexes (already exist) |

**Overall Risk**: 🟢 **LOW** - Architecture is solid

---

## Recommendations

### Must Do
1. ✅ Follow existing authentication pattern from [app/(root)/layout.tsx](app/(root)/layout.tsx)
2. ✅ Always verify `userId` matches authenticated user
3. ✅ Use `lean()` in queries for performance
4. ✅ Return consistent error response format
5. ✅ Test unauthorized access (no session)

### Should Do
1. ✅ Add Zod validation for request bodies (optional but recommended)
2. ✅ Add rate limiting (optional)
3. ✅ Log important operations (add/remove)
4. ✅ Document API responses with JSDoc

### Optional
1. Pagination for watchlist (currently not needed)
2. Caching (Redis) (currently not needed)
3. WebSocket updates (currently not needed)

---

## Next Steps

1. **Review this document** - Confirm you're comfortable with approach
2. **Check dependencies** - Verify all imports exist
3. **Create file structure** - No code yet, just folders
4. **Implement Phase 1-4** - One phase at a time
5. **Test each endpoint** - Before moving to next
6. **Connect frontend** - Modify WatchlistButton
7. **Integration testing** - Full user flow
8. **Code review** - Have someone check security

---

## Files to Reference During Implementation

| Purpose | File | Use Case |
|---------|------|----------|
| Auth pattern | [app/(root)/layout.tsx](app/(root)/layout.tsx) | How to get session in server code |
| DB connection | [lib/actions/user.actions.ts](lib/actions/user.actions.ts) | How to query MongoDB |
| Watchlist ops | [lib/actions/watchlist.actions.ts](lib/actions/watchlist.actions.ts) | Database operations |
| Error handling | [lib/actions/auth.actions.ts](lib/actions/auth.actions.ts) | Response format |
| Model | [database/models/watchlist.model.ts](database/models/watchlist.model.ts) | Schema reference |

---

## Conclusion

✅ **Your approach is architecturally sound**

The proposed API routes will:
- Not break existing functionality
- Follow established patterns in your codebase
- Properly integrate with Better Auth
- Leverage existing database setup
- Maintain user isolation and security

**Ready to proceed with implementation** 🚀

---

*Generated: January 25, 2026*
