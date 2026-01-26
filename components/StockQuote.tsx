'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';

interface StockQuoteProps {
  symbol: string;
}

interface QuoteData {
  price: number;
  change: number;
  changePercent: number;
  logo?: string;
}

export default function StockQuote({ symbol }: StockQuoteProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const response = await fetch(`/api/watchlist/quote?symbol=${symbol}`);
        if (response.ok) {
          const data = await response.json();
          setQuote(data);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [symbol]);

  if (loading) {
    return <div className="text-xs text-gray-500">Loading...</div>;
  }

  if (!quote) {
    return <div className="text-xs text-gray-500">No data</div>;
  }

  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-2">
      {quote.logo && (
        <div className="flex items-center gap-2">
          <Image
            src={quote.logo}
            alt={symbol}
            width={32}
            height={32}
            className="rounded"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-100">${quote.price.toFixed(2)}</span>
        <div className={`flex items-center gap-1 ${changeColor}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
