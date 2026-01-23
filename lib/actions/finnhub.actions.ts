'use server';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

interface NewsArticle {
  id?: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: number;
  category?: string;
}

interface FormattedArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: string;
}

const fetchJSON = async (
  url: string,
  revalidateSeconds?: number
): Promise<unknown> => {
  const options: RequestInit = {
    method: 'GET',
  };

  if (revalidateSeconds !== undefined) {
    options.cache = 'force-cache';
    options.next = { revalidate: revalidateSeconds };
  } else {
    options.cache = 'no-store';
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const isValidArticle = (article: unknown): article is NewsArticle => {
  return (
    article !== null &&
    typeof article === 'object' &&
    'headline' in article &&
    typeof (article as any).headline === 'string' &&
    'url' in article &&
    typeof (article as any).url === 'string' &&
    'datetime' in article &&
    typeof (article as any).datetime === 'number'
  );
};

const formatArticle = (article: NewsArticle): FormattedArticle => {
  const id = article.id || article.url;
  const date = new Date(article.datetime * 1000);

  return {
    id,
    headline: article.headline,
    summary: article.summary || '',
    source: article.source || 'Unknown',
    url: article.url,
    image: article.image,
    datetime: date.toISOString(),
  };
};

export const getNews = async (symbols?: string[]): Promise<FormattedArticle[]> => {
  try {
    if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
      throw new Error('NEXT_PUBLIC_FINNHUB_API_KEY is not configured');
    }

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fromDate = fiveDaysAgo.toISOString().split('T')[0];
    const toDate = now.toISOString().split('T')[0];

    let articles: FormattedArticle[] = [];

    if (symbols && symbols.length > 0) {
      // Clean and uppercase symbols
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);

      // Round-robin through symbols (max 6 loops)
      const maxRounds = Math.min(6, cleanedSymbols.length);
      const collectedArticles: Map<string, FormattedArticle> = new Map();

      for (let round = 0; round < maxRounds; round++) {
        for (const symbol of cleanedSymbols) {
          if (collectedArticles.size >= 6) break;

          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;

          const newsData = await fetchJSON(url, 3600); // 1 hour cache
          const newsArray = Array.isArray(newsData) ? newsData : [];

          for (const item of newsArray) {
            if (isValidArticle(item) && collectedArticles.size < 6) {
              const formatted = formatArticle(item);
              // Use URL as unique key to avoid duplicates
              if (!collectedArticles.has(formatted.url)) {
                collectedArticles.set(formatted.url, formatted);
              }
              break; // Take one valid article per round per symbol
            }
          }
        }

        if (collectedArticles.size >= 6) break;
      }

      articles = Array.from(collectedArticles.values());
    } else {
      // Fetch general market news
      const url = `${FINNHUB_BASE_URL}/news?category=general&minId=0&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;

      const newsData = await fetchJSON(url, 3600); // 1 hour cache
      const newsArray = Array.isArray(newsData) ? newsData : [];

      // Deduplicate by id, url, and headline
      const seen = new Set<string>();
      const formatted: FormattedArticle[] = [];

      for (const item of newsArray) {
        if (isValidArticle(item)) {
          const key = item.id || item.url || item.headline;

          if (!seen.has(key)) {
            seen.add(key);
            formatted.push(formatArticle(item));

            if (formatted.length >= 6) break;
          }
        }
      }

      articles = formatted;
    }

    // Sort by datetime descending and return
    return articles.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching news from Finnhub:', error);
    throw new Error('Failed to fetch news');
  }
};
