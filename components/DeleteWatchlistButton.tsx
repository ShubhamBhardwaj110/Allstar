'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteWatchlistButtonProps {
  symbol: string;
}

export default function DeleteWatchlistButton({ symbol }: DeleteWatchlistButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/watchlist/${symbol}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${symbol} removed from watchlist`);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to remove stock');
      }
    } catch (error) {
      toast.error('Error removing stock from watchlist');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      title={`Remove ${symbol} from watchlist`}
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
