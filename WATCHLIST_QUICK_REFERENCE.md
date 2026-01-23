# Watchlist System - Quick Reference

## Files Created/Modified

### Created Files
1. **`/database/models/watchlist.model.ts`** - Mongoose schema for watchlists
2. **`/lib/actions/watchlist.actions.ts`** - Watchlist query functions
3. **`/lib/actions/finnhub.actions.ts`** - News fetching from Finnhub API
4. **`WATCHLIST_IMPLEMENTATION.md`** - Complete documentation

### Modified Files
1. **`/lib/inngest/functions.ts`** - Added `sendDailyNewsSummary` function
2. **`/lib/nodemailer/index.ts`** - Added `sendNewsEmailToUser` function

---

## Core API

### Database - Watchlist
```typescript
import { Watchlist, WatchlistItem } from '@/database/models/watchlist.model';

// Add stock
await Watchlist.create({ userId: 'id', symbol: 'AAPL', company: 'Apple Inc.' });

// Get all for user
await Watchlist.find({ userId: 'id' });

// Remove from watchlist
await Watchlist.deleteOne({ userId: 'id', symbol: 'AAPL' });
```

### Actions - Watchlist
```typescript
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';

// Get symbols for user email
const symbols = await getWatchlistSymbolsByEmail('user@example.com');
// Returns: ['AAPL', 'MSFT', 'GOOGL']
```

### Actions - News
```typescript
import { getNews } from '@/lib/actions/finnhub.actions';

// Personalized news for watchlist
const news = await getNews(['AAPL', 'MSFT']);

// General market news
const general = await getNews();

// Result structure
// [{
//   id: 'unique-id',
//   headline: 'Apple announces new iPhone',
//   summary: 'Apple has announced...',
//   source: 'Reuters',
//   url: 'https://example.com',
//   image: 'https://example.com/image.jpg',
//   datetime: '2025-01-22T15:30:00Z'
// }]
```

### Inngest Functions
```typescript
import { sendDailyNewsSummary } from '@/lib/inngest/functions';

// Triggers automatically at 12 PM UTC daily
// Or manually trigger:
await inngestClient.send({
  name: 'app/send.daily.news'
});
```

---

## Environment Variables

```env
# Required for Finnhub API
NEXT_PUBLIC_FINNHUB_API_KEY=your_key

# Required for email sending
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=app_password

# Better Auth
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://...
```

---

## Data Flow

### Adding to Watchlist
```
User -> Add Stock Form -> API Route -> Watchlist.create() -> MongoDB
```

### Daily News Summary
```
Cron (12 PM UTC)
  ↓
Get all users
  ↓
For each user:
  - Get watchlist symbols
  - Fetch news (Finnhub API)
  - Generate summary (Gemini AI)
  - Send email (Nodemailer)
```

---

## Validation Rules

✅ Stock symbol: Auto-uppercase, max 10 chars  
✅ Company name: Trimmed, required  
✅ User ID: Required, indexed  
✅ Duplicate prevention: (userId, symbol) unique index  
✅ Articles per user: Max 6  
✅ News sorting: By datetime descending  
✅ Date range: Last 5 days  

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| User not found | Return empty array |
| No watchlist symbols | Fall back to general news |
| API error | Log error, throw message |
| No articles | Return empty array or default message |
| Invalid article | Skip and continue |
| Email error | Log per user, continue |

---

## Performance

- **Watchlist queries**: O(1) via indexed userId
- **Duplicate prevention**: O(1) via unique compound index
- **API caching**: 1 hour ISR for Finnhub
- **Batch emails**: Single Inngest function processes all users
- **Deduplication**: O(n) for general news, prevents duplicates

---

## Testing Commands

```bash
# Compile check
npm run lint

# Type check
npx tsc --noEmit

# Test watchlist fetch
node -e "
const { getWatchlistSymbolsByEmail } = require('./lib/actions/watchlist.actions');
getWatchlistSymbolsByEmail('user@example.com').then(console.log);
"

# Test news fetch
node -e "
const { getNews } = require('./lib/actions/finnhub.actions');
getNews(['AAPL']).then(console.log);
"
```

---

## Database Indexes

```
Watchlist collection:
  - userId (ascending)
  - userId + symbol (ascending, unique)
```

---

## Next Steps

1. Set environment variables in `.env`
2. Deploy Finnhub API integration
3. Configure Inngest triggers
4. Test email sending with real SMTP
5. Monitor cron job execution
6. Add watchlist UI components
7. Create API routes for CRUD operations
