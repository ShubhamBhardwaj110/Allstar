'use server';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth/auth';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

/**
 * GET /api/watchlist
 * Fetch all stocks in the user's watchlist
 * 
 * Response: { success: boolean, data?: WatchlistItem[], error?: string }
 */
export async function GET(req: NextRequest) {
  try {
    // Step 1: Get authenticated user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 1.5: Check rate limit (100 requests per hour)
    const rateLimitResult = checkRateLimit(session.user.id, RATE_LIMITS.API);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
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

    // Step 2: Connect to database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection not found');
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Step 3: Query watchlist for authenticated user
    const watchlistItems = await Watchlist.find(
      { userId: session.user.id },
      { userId: 0 } // Exclude userId from response
    )
      .lean()
      .sort({ addedAt: -1 }); // Sort by most recently added

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        data: watchlistItems,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/watchlist:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add a stock to the user's watchlist
 * 
 * Body: { symbol: string, company: string }
 * Response: { success: boolean, data?: WatchlistItem, error?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Get authenticated user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 1.5: Check rate limit (100 requests per hour)
    const rateLimitResult = checkRateLimit(session.user.id, RATE_LIMITS.API);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
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

    // Step 2: Parse and validate request body
    const body = await req.json();
    const { symbol, company } = body;

    // Validate inputs
    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Symbol is required and must be a string' },
        { status: 400 }
      );
    }

    if (!company || typeof company !== 'string' || company.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Company is required and must be a string' },
        { status: 400 }
      );
    }

    // Step 3: Connect to database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection not found');
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Step 4: Attempt to create watchlist entry
    const cleanedSymbol = symbol.trim().toUpperCase();
    const cleanedCompany = company.trim();

    const watchlistItem = await Watchlist.create({
      userId: session.user.id,
      symbol: cleanedSymbol,
      company: cleanedCompany,
    });

    // Step 5: Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          _id: watchlistItem._id,
          symbol: watchlistItem.symbol,
          company: watchlistItem.company,
          addedAt: watchlistItem.addedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/watchlist:', error);

    // Handle duplicate entry error (E11000 is MongoDB duplicate key error)
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'This stock is already in your watchlist',
        },
        { status: 409 }
      );
    }

    // Handle validation errors from Mongoose
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(', ');
      return NextResponse.json(
        { success: false, error: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
