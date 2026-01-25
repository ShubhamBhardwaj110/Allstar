'use server';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth/auth';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

/**
 * DELETE /api/watchlist/[symbol]
 * Remove a stock from the user's watchlist
 * 
 * Params: symbol (stock ticker)
 * Response: { success: boolean, message?: string, error?: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
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

    // Step 2: Extract and validate symbol from params
    const { symbol } = await params;

    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Symbol is required and must be a string' },
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

    // Step 4: Delete watchlist entry
    const cleanedSymbol = symbol.trim().toUpperCase();

    const result = await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: cleanedSymbol,
    });

    // Step 5: Check if item was found and deleted
    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock '${cleanedSymbol}' not found in your watchlist`,
        },
        { status: 404 }
      );
    }

    // Step 6: Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Stock '${cleanedSymbol}' removed from watchlist`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/watchlist/[symbol]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
