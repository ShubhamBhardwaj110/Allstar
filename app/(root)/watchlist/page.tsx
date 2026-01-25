import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import Link from 'next/link';

export default async function WatchlistPage() {
  // Get authenticated user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Fetch user's watchlist
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <p className="empty-description">Database connection error. Please try again later.</p>
        </div>
      </div>
    );
  }

  const watchlistItems = await Watchlist.find(
    { userId: session.user.id },
    { userId: 0 }
  )
    .lean()
    .sort({ addedAt: -1 });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="watchlist-title">My Watchlist</h1>
        <span className="text-sm text-gray-400">
          {watchlistItems.length} stock{watchlistItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty State */}
      {watchlistItems.length === 0 ? (
        <div className="watchlist-empty-container">
          <div className="watchlist-empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="watchlist-star"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
              />
            </svg>
            <h2 className="empty-title">Your watchlist is empty</h2>
            <p className="empty-description">
              Start by searching for stocks and adding them to your watchlist
            </p>
            <Link
              href="/"
              className="watchlist-btn"
            >
              Explore Stocks
            </Link>
          </div>
        </div>
      ) : (
        /* Watchlist Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistItems.map((item: any) => (
            <Link
              key={item._id.toString()}
              href={`/stocks/${item.symbol}`}
              className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-yellow-500 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-100">{item.symbol}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{item.company}</p>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 hover:text-yellow-500 transition-colors">
                    View details →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
