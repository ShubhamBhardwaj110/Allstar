# Watchlist System Implementation Guide

## Overview
A complete watchlist system has been implemented for the Stock Trading App with the following components:

---

## 1. Watchlist Model (`/database/models/watchlist.model.ts`)

### Schema Definition
```typescript
interface WatchlistItem extends Document {
  userId: string;           // User ID from Better Auth
  symbol: string;           // Stock ticker (auto-uppercased)
  company: string;          // Company name
  addedAt: Date;           // Timestamp when added
}
```

### Key Features
- **userId**: Required, indexed for fast queries
- **symbol**: Auto-converted to uppercase, trimmed
- **company**: Company name, required and trimmed
- **addedAt**: Auto-defaults to current date/time
- **Compound Index**: Unique `(userId, symbol)` prevents duplicate watchlist entries

### Usage
```typescript
import { Watchlist, WatchlistItem } from '@/database/models/watchlist.model';

// Add to watchlist
const item = await Watchlist.create({
  userId: user._id.toString(),
  symbol: 'AAPL',
  company: 'Apple Inc.'
});

// Query watchlist
const userWatchlist = await Watchlist.find({ userId: user._id.toString() });
```

---

## 2. Watchlist Actions (`/lib/actions/watchlist.actions.ts`)

### Function: `getWatchlistSymbolsByEmail(email: string): Promise<string[]>`

**Purpose**: Retrieve all stock symbols from a user's watchlist by their email address.

**Parameters**:
- `email`: User's email address (from Better Auth)

**Returns**: Array of stock symbols (uppercase strings)

**Behavior**:
1. Connects to the database
2. Finds user by email in the `users` collection
3. Returns empty array if user not found
4. Queries watchlist for that user and extracts symbols
5. Returns symbols array, or empty array on error

**Example**:
```typescript
const symbols = await getWatchlistSymbolsByEmail('user@example.com');
// Returns: ['AAPL', 'MSFT', 'GOOGL']
```

**Error Handling**: Gracefully returns empty array on any error with console logging

---

## 3. Finnhub News Actions (`/lib/actions/finnhub.actions.ts`)

### Constants
- `FINNHUB_BASE_URL`: `https://finnhub.io/api/v1`
- `NEXT_PUBLIC_FINNHUB_API_KEY`: From environment variables

### Type Definitions
```typescript
interface NewsArticle {
  id?: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: number;    // Unix timestamp
  category?: string;
}

interface FormattedArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: string;    // ISO string
}
```

### Helper Function: `fetchJSON(url, revalidateSeconds?): Promise<unknown>`

**Caching Strategy**:
- If `revalidateSeconds` provided: Uses `cache: force-cache` with ISR
- Otherwise: Uses `cache: no-store` for fresh data
- Throws error on non-200 responses

### Main Function: `getNews(symbols?: string[]): Promise<FormattedArticle[]>`

**Purpose**: Fetch news articles, either personalized (by symbols) or general market news.

#### With Symbols (Personalized News)
1. Cleans and uppercases symbols
2. Implements round-robin algorithm through symbols (max 6 rounds)
3. Fetches company-specific news from Finnhub
4. Takes 1 valid article per symbol per round
5. Stops when reaching 6 articles total
6. **Caching**: 1-hour ISR cache

#### Without Symbols (General News)
1. Fetches general market news from Finnhub
2. Deduplicates by `id`, `url`, and `headline`
3. Validates each article
4. Returns top 6 articles
5. **Caching**: 1-hour ISR cache

#### Date Range
- Automatically calculates last 5 days from today
- Format: `YYYY-MM-DD`

#### Error Handling
- Logs all errors to console
- Throws `Failed to fetch news` on critical errors
- Validates all articles before returning

**Example**:
```typescript
// Personalized news
const news = await getNews(['AAPL', 'MSFT']);

// General market news
const generalNews = await getNews();
```

---

## 4. Inngest Functions (`/lib/inngest/functions.ts`)

### Existing Function: `sendSignUpEmail`
- Unchanged from original implementation
- Triggered on user creation
- Uses AI to generate personalized welcome intro

### New Function: `sendDailyNewsSummary`

**Triggers**:
1. CRON: `0 12 * * *` (Daily at 12:00 PM UTC)
2. Event: `app/send.daily.news` (Manual trigger)

**Workflow**:

#### Step 1: Get All Users
- Retrieves all users from the database via `getAllUsersForNewsEmail`
- Returns early if no users found

#### Step 2: Fetch Personalized News
- For each user:
  1. Gets their watchlist symbols via `getWatchlistSymbolsByEmail`
  2. If symbols exist: Fetches personalized news for those symbols
  3. If no symbols: Falls back to general market news
  4. Limits to max 6 articles per user
  5. Handles errors gracefully (returns empty array for user)

#### Step 3: Summarize News via AI
- For each user:
  1. If no articles: Returns default message
  2. Formats articles into readable structure
  3. Uses Gemini 2.5 Flash Lite to summarize
  4. Falls back to default message on AI error

#### Step 4: Send Emails
- Uses `sendNewsEmailToUser` to send to each user
- Includes article count in subject and body
- Handles per-user email errors gracefully

**Return Value**:
```typescript
{
  success: true,
  message: "Daily news summary sent to {count} users"
}
```

---

## 5. Email Functions (`/lib/nodemailer/index.ts`)

### Interface: `NewsEmailData`
```typescript
interface NewsEmailData {
  email: string;           // Recipient email
  name: string;            // Recipient name
  newsContent: string;     // HTML content
  articleCount: number;    // Number of articles
}
```

### Function: `sendNewsEmailToUser(data: NewsEmailData)`

**Features**:
- Uses `NEWS_SUMMARY_EMAIL_TEMPLATE` from templates
- Formats date as "Monday, January 22, 2025"
- Includes article count in subject and text
- Replaces template placeholders:
  - `{{date}}`: Formatted current date
  - `{{newsContent}}`: AI-generated HTML summary

**Email Template**:
Uses `NEWS_SUMMARY_EMAIL_TEMPLATE` which includes:
- Professional dark-mode styling
- Mobile-responsive design
- Logo header
- Title: "Market News Summary Today"
- Dynamic news content area
- Footer with unsubscribe link

---

## Environment Variables Required

```env
# Finnhub API
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key

# Nodemailer (Gmail)
NODEMAILER_EMAIL=your_gmail@gmail.com
NODEMAILER_PASSWORD=your_app_password

# Better Auth
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://...
```

---

## Error Handling Strategy

### Watchlist Actions
- User not found → Return empty array
- Database error → Log error, return empty array

### Finnhub Actions
- API error → Throw with message
- Invalid article → Skip and continue
- No results → Return empty array

### Inngest Functions
- No users → Return early
- Per-user error → Log and continue with next user
- AI error → Use fallback message
- Email error → Log per user, continue

---

## Key Implementation Rules Followed

✅ **Strong Typing**: No `any` types except in necessary type guards  
✅ **Graceful Degradation**: Empty arrays instead of crashing  
✅ **Max 6 Articles**: Enforced at multiple levels  
✅ **Caching Strategy**: 1-hour ISR for news, no-store for fresh requests  
✅ **Deduplication**: By ID, URL, and headline for general news  
✅ **Round-robin**: Symbol news fetching for balanced coverage  
✅ **AI Integration**: Gemini 2.5 Flash Lite for summaries  
✅ **Email Templating**: Dark-mode, mobile-responsive design  

---

## Testing Guide

### 1. Test Watchlist Model
```typescript
import { Watchlist } from '@/database/models/watchlist.model';

// Create
const item = await Watchlist.create({
  userId: '123',
  symbol: 'AAPL',
  company: 'Apple Inc.'
});

// Query
const items = await Watchlist.find({ userId: '123' });
```

### 2. Test Watchlist Actions
```typescript
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';

const symbols = await getWatchlistSymbolsByEmail('user@example.com');
console.log(symbols); // ['AAPL', 'MSFT']
```

### 3. Test Finnhub Actions
```typescript
import { getNews } from '@/lib/actions/finnhub.actions';

// With symbols
const news = await getNews(['AAPL']);

// General news
const generalNews = await getNews();
```

### 4. Trigger Daily News Summary
```typescript
// Manual trigger via API
const result = await inngestClient.send({
  name: 'app/send.daily.news',
  data: {}
});
```

---

## Integration Checklist

- [x] Watchlist model with proper schema and indexes
- [x] Watchlist actions for retrieving symbols by email
- [x] Finnhub integration with caching and validation
- [x] Inngest daily news summary function
- [x] Email templating and sending
- [x] Error handling and logging
- [x] TypeScript type safety
- [x] No hardcoded values
- [x] Environment variable support

---

## Performance Considerations

1. **Database Indexes**: Compound index on `(userId, symbol)` prevents duplicates
2. **API Caching**: 1-hour ISR for news reduces API calls
3. **Batch Processing**: Inngest handles all users in single function
4. **Deduplication**: Prevents duplicate articles in general news
5. **Round-robin**: Balanced news fetching across multiple symbols

---

## Future Enhancements

- [ ] Add watchlist size limits per user
- [ ] Implement watchlist categories/portfolios
- [ ] Add stock price alerts
- [ ] Enable email frequency preferences
- [ ] Add analytics for news click-through rates
- [ ] Support for additional news sources beyond Finnhub
- [ ] Implement news sentiment analysis
