import { getStockQuote, getCompanyLogo } from '@/lib/actions/finnhub.actions';
import { auth } from '@/lib/better-auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';


export async function GET(req: NextRequest) {
  try {
    // 1 VERIFY USER IS AUTHENTICATED
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2 CHECK RATE LIMIT (100 requests per hour per user)
    const rateLimitResult = checkRateLimit(session.user.id, RATE_LIMITS.QUOTE_API);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
          },
        }
      );
    }

    // 3 Extract and validate symbol
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
