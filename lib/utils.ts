import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDateRange = (days: number) => {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  return {
    from: formatDate(past),
    to: formatDate(now),
  };
};

export const validateArticle = (article: unknown): article is RawNewsArticle => {
  return (
    article !== null &&
    typeof article === 'object' &&
    'headline' in article &&
    typeof (article as any).headline === 'string' &&
    'url' in article &&
    typeof (article as any).url === 'string'
  );
};

export const formatArticle = (
  article: RawNewsArticle,
  isSymbolSpecific: boolean = false,
  symbol?: string,
  index: number = 0
): MarketNewsArticle => {
  return {
    id: article.id || index,
    headline: article.headline || 'Untitled',
    summary: article.summary || '',
    source: article.source || 'Unknown',
    url: article.url || '',
    datetime: article.datetime || 0,
    category: article.category || 'general',
    related: symbol || article.related || '',
    image: article.image,
  };
};
