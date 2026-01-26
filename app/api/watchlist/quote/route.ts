import { getStockQuote, getCompanyLogo } from '@/lib/actions/finnhub.actions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const [quote, logo] = await Promise.all([
      getStockQuote(symbol),
      getCompanyLogo(symbol),
    ]);

    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...quote,
      logo,
    });
  } catch (error) {
    console.error('Error in quote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
