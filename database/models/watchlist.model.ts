import mongoose, { Document, Schema } from 'mongoose';

export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const watchlistSchema = new Schema<WatchlistItem>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Compound index to prevent duplicate symbols for the same user
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Watchlist =
  mongoose.models?.Watchlist || mongoose.model<WatchlistItem>('Watchlist', watchlistSchema);
