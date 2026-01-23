'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection not found');
      return [];
    }

    // Find user by email in the users collection (Better Auth)
    const user = await db.collection('users').findOne(
      { email },
     
    );

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    // Query watchlist by userId and extract symbols
    const watchlistItems = await Watchlist.find(
      { userId: user._id.toString() },
      { symbol: 1 }
    ).lean();

    const symbols = watchlistItems.map((item) => item.symbol as string);
    return symbols;
  } catch (error) {
    console.error('Error fetching watchlist symbols by email:', error);
    return [];
  }
};
